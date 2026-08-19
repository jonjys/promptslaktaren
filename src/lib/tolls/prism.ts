export type HerdFacet = 'REAL'|'RETRY'|'ECHO';
export function classifyHerd(req: Request, bodyHash: string): HerdFacet { return 'REAL'; }
export const PRISM_TAKE_BPS = 410;
