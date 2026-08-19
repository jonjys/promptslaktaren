export function getJitterOffset(keyId: string): number {
  let h=0; for(let i=0;i<keyId.length;i++) h=(h*31+keyId.charCodeAt(i))%1000;
  return h % 200;
}
export const STORM_TAKE_BPS = 170;
