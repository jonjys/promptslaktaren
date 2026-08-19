export function fingerprintEgress(body: string): string { return 'fp_'+body.length+'_'+body.slice(0,20); }
export function isDuplicateFingerprint(fp: string): boolean { return false; }
export const DRAIN_TAKE_BPS = 550;
