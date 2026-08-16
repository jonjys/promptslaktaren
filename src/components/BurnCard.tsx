"use client"
import { burnKey } from "@/lib/secure-store"
export default function BurnCard({ keyId, onBurned }: { keyId: string; onBurned: ()=>void }){
  return <button onClick={async()=>{ if(confirm("BURN "+keyId+" forever?")){ await burnKey(keyId); onBurned(); } }} className="bg-[#ff0033] text-white px-3 py-1 text-xs font-bold hover:bg-[#cc0029]">?? BURN</button>
}
