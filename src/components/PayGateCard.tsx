"use client"
import { useState } from "react"
import { exposeLocalhost, simulatePaidCall } from "@/lib/paygate"
export default function PayGateCard(){
  const [port,setPort]=useState(3000); const [price,setPrice]=useState(0.5); const [exp,setExp]=useState<any>(null)
  return (
    <div className="border border-[#00FF88] bg-black p-4 mt-4">
      <h3 className="text-[#00FF88] font-bold text-sm">PayGate - Monetize localhost</h3>
      <div className="flex gap-2 mt-2">
        <input type="number" value={port} onChange={e=>setPort(Number(e.target.value))} className="bg-[#111] border border-[#333] px-2 py-1 w-20 text-xs text-white" />
        <input type="number" value={price} onChange={e=>setPrice(Number(e.target.value))} className="bg-[#111] border border-[#333] px-2 py-1 w-24 text-xs text-white" />
        <button onClick={async()=>{ const ex = await exposeLocalhost(port, price); setExp(ex)}} className="bg-[#00FF88] text-black px-4 font-bold text-xs">Expose</button>
      </div>
      {exp && (
        <div className="mt-3 text-xs font-mono">
          <div className="text-[#888]">{exp.publicUrl}</div>
          <button onClick={()=>{ setExp(simulatePaidCall(exp))}} className="mt-2 border border-[#00FF88] px-2 py-1 text-[#00FF88]">Simulate paid call</button>
          <div className="mt-1 text-white">{exp.calls} calls - ${exp.earned.toFixed(2)} earned - fee ${exp.fee.toFixed(2)}</div>
        </div>
      )}
    </div>
  )
}
