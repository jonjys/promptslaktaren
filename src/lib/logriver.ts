export type LogEntry = { ts: string; source: string; msg: string; level: string }
export async function getMergedTail(){
  return navigator.locks.request("logriver", {mode:"shared"}, async()=>{
    return [
      {ts: new Date().toLocaleTimeString(), source:"Stripe", msg:"webhook 402 payment_intent failed", level:"error"},
      {ts: new Date().toLocaleTimeString(), source:"Supabase", msg:"query slow 340ms", level:"warn"},
      {ts: new Date().toLocaleTimeString(), source:"Vercel", msg:"GET /api/proxy 200 42ms", level:"info"},
      {ts: new Date().toLocaleTimeString(), source:"Localhost", msg:"withUnlockedKey 50ms", level:"info"},
    ]
  })
}
export function findErrorOrigin(logs: any[]){
  const e = logs.find((l:any)=>l.level==="error");
  return e? "Error likely in "+e.source+", not Vercel" : "No error"
}
