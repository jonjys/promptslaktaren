export type PayGateExposure = { id: string; port: number; pricePerCall: number; publicUrl: string; calls: number; earned: number; fee: number; }
export async function exposeLocalhost(port: number, price: number): Promise<PayGateExposure> {
  const id = Math.random().toString(36).slice(2,8);
  return { id, port, pricePerCall: price, publicUrl: "https://promptslaktaren.vercel.app/api/gate/exposed/"+id, calls: 0, earned: 0, fee: 0 }
}
export function simulatePaidCall(exp: any) {
  const fee = exp.pricePerCall * 0.02;
  return {...exp, calls: exp.calls+1, earned: exp.earned + exp.pricePerCall - fee, fee: exp.fee + fee }
}
