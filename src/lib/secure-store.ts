/**
 * BridgeControl secure store
 * Keys NEVER leave the machine. Only encrypted blobs in IndexedDB.
 * No server-side secret storage.
 */

const DB_NAME = "bridgecontrol";
const DB_VERSION = 1;
const STORE = "keys";
const META = "meta";

export type KeyMeta = {
  id: string;
  name: string;
  provider: string;
  masked: string;
  createdAt: number;
  lastUsedAt: number | null;
  usageCount: number;
};

type StoredKey = KeyMeta & {
  ciphertext: ArrayBuffer;
  iv: ArrayBuffer;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META, { keyPath: "id" });
      }
    };
  });
}

async function getOrCreateMasterKey(): Promise<CryptoKey> {
  const db = await openDB();
  const existing = await new Promise<ArrayBuffer | null>((resolve, reject) => {
    const tx = db.transaction(META, "readonly");
    const req = tx.objectStore(META).get("master-jwk");
    req.onsuccess = () => resolve(req.result?.jwk ?? null);
    req.onerror = () => reject(req.error);
  });

  if (existing) {
    return crypto.subtle.importKey(
      "jwk",
      JSON.parse(new TextDecoder().decode(existing)) as JsonWebKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const jwk = await crypto.subtle.exportKey("jwk", key);
  const buf = new TextEncoder().encode(JSON.stringify(jwk));

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(META, "readwrite");
    tx.objectStore(META).put({ id: "master-jwk", jwk: buf });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function maskKey(value: string): string {
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function detectProvider(name: string, value: string): string {
  const n = name.toLowerCase();
  const v = value.toLowerCase();
  if (n.includes("stripe") || v.startsWith("sk_")) return "stripe";
  if (n.includes("openai") || v.startsWith("sk-")) return "openai";
  if (n.includes("anthropic") || v.startsWith("sk-ant")) return "anthropic";
  if (n.includes("supabase")) return "supabase";
  return "custom";
}

export async function importEnvText(text: string): Promise<KeyMeta[]> {
  const master = await getOrCreateMasterKey();
  const lines = text.split(/\r?\n/);
  const imported: KeyMeta[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const name = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!value) continue;

    const id = crypto.randomUUID();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      master,
      new TextEncoder().encode(value)
    );

    const meta: KeyMeta = {
      id,
      name,
      provider: detectProvider(name, value),
      masked: maskKey(value),
      createdAt: Date.now(),
      lastUsedAt: null,
      usageCount: 0,
    };

    const stored: StoredKey = {
      ...meta,
      ciphertext,
      iv: iv.buffer,
    };

    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(stored);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    imported.push(meta);
  }

  return imported;
}

export async function listKeys(): Promise<KeyMeta[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const rows = (req.result as StoredKey[]).map(
        ({ ciphertext, iv, ...meta }) => meta
      );
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function unlockKeyValue(id: string): Promise<string> {
  const master = await getOrCreateMasterKey();
  const db = await openDB();
  const stored = await new Promise<StoredKey>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => {
      if (!req.result) reject(new Error("Key not found"));
      else resolve(req.result);
    };
    req.onerror = () => reject(req.error);
  });

  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(stored.iv) },
    master,
    stored.ciphertext
  );
  return new TextDecoder().decode(plain);
}

export async function withUnlockedKey<T>(
  keyId: string,
  fn: (plaintext: string) => Promise<T>
): Promise<T> {
  const lockName = `bridge-key-${keyId}`;
  return navigator.locks.request(lockName, { mode: "exclusive" }, async () => {
    const plain = await unlockKeyValue(keyId);
    await bumpUsage(keyId);
    return fn(plain);
  });
}

export async function proveLock(
  keyId: string
): Promise<{ ok: true; tookMs: number; usageCount: number }> {
  const t0 = performance.now();
  await withUnlockedKey(keyId, async () => {
    await new Promise((r) => setTimeout(r, 8));
  });
  const keys = await listKeys();
  const k = keys.find((x) => x.id === keyId);
  return {
    ok: true,
    tookMs: Math.round(performance.now() - t0),
    usageCount: k?.usageCount ?? 0,
  };
}

export async function bumpUsage(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.get(id);
    req.onsuccess = () => {
      const row = req.result as StoredKey | undefined;
      if (!row) {
        resolve();
        return;
      }
      row.usageCount += 1;
      row.lastUsedAt = Date.now();
      store.put(row);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteKey(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function pickAndImportEnv(): Promise<KeyMeta[]> {
  // @ts-expect-error File System Access API
  if (!window.showOpenFilePicker) {
    throw new Error(
      "File System Access API not supported. Use Chrome/Edge, or paste .env content."
    );
  }
  // @ts-expect-error
  const [handle] = await window.showOpenFilePicker({
    types: [
      {
        description: "Env files",
        accept: { "text/plain": [".env", ".env.local", ".txt"] },
      },
    ],
    multiple: false,
  });
  const file = await handle.getFile();
  const text = await file.text();
  return importEnvText(text);
}

/** BURN – one-time decrypt under exclusive lock, then permanent delete. */
export async function withBurnedKey<T>(
  keyId: string,
  cb: (v: string) => Promise<T> | T
): Promise<{ result: T; burnedAt: number }> {
  const lockName = `bridge-key-${keyId}`;
  return navigator.locks.request(lockName, { mode: "exclusive" }, async () => {
    const plain = await unlockKeyValue(keyId);
    await deleteKey(keyId);
    const burnedAt = Date.now();
    const result = await cb(plain);
    return { result, burnedAt };
  });
}

export async function burnKey(
  keyId: string
): Promise<{ burnedAt: number; tookMs: number }> {
  const t0 = performance.now();
  const { burnedAt } = await withBurnedKey(keyId, async () => {
    await new Promise((r) => setTimeout(r, 6));
  });
  return { burnedAt, tookMs: Math.round(performance.now() - t0) };
}
