export async function mintLease(keyId: string, provider: string) {
  const token = 'lease_'+Math.random().toString(36).slice(2);
  return { token, expiresAt: Date.now()+60000 };
}
export const LEASE_TAKE_BPS = 240;
