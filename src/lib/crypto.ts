/**
 * BridgeControl crypto — AES-GCM, device-bound.
 * Plaintext must never land in React state or DOM.
 */

const META_DB = "bridgecontrol";
const META_STORE = "meta";

function openMeta(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(META_DB, 2);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("keys"))
        db.createObjectStore("keys", { keyPath: "id" });
      if (!db.objectStoreNames.contains(META_STORE))
        db.createObjectStore(META_STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains("usage_events"))
        db.createObjectStore("usage_events", { keyPath: "id" });
      if (!db.objectStoreNames.contains("radar_cfg"))
        db.createObjectStore("radar_cfg", { keyPath: "id" });
    };
  });
}

export async function getDeviceKey(): Promise<CryptoKey> {
  const db = await openMeta();
  const existing = await new Promise<ArrayBuffer | null>((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readonly");
    const req = tx.objectStore(META_STORE).get("master-jwk");
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
    const tx = db.transaction(META_STORE, "readwrite");
    tx.objectStore(META_STORE).put({ id: "master-jwk", jwk: buf });
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

export async function encryptValue(plain: string): Promise<{ ciphertext: ArrayBuffer; iv: ArrayBuffer }> {
  const key = await getDeviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plain)
  );
  return { ciphertext, iv: iv.buffer };
}

export async function decryptValue(ciphertext: ArrayBuffer, iv: ArrayBuffer): Promise<string> {
  const key = await getDeviceKey();
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plain);
}

export function maskSecret(value: string): string {
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

/** Clipboard auto-wipe after ms (best-effort) */
export function scheduleClipboardWipe(ms = 5000): void {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
  setTimeout(() => {
    void navigator.clipboard.writeText("").catch(() => {});
  }, ms);
}
