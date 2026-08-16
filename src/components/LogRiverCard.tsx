"use client"
import { useEffect, useState } from "react"
import { getMergedTail, findErrorOrigin } from "@/lib/logriver"
export default function LogRiverCard(){
  const [logs,setLogs]=useState<any[]>([]); const [tab,setTab]=useState("All"); const [hint,setHint]=useState("")
  useEffect(()=>{ (async()=> setLogs(await getMergedTail()))(); const i = setInterval(async()=> setLogs(await getMergedTail()), 3000); return ()=>clearInterval(i) },[])
  return (
    <div className="border border-[#333] bg-black p-4 mt-4">
      <div className="flex justify-between"><h3 className="text-[#00FF88] font-bold text-sm">LogRiver</h3><button onClick={()=> setHint(findErrorOrigin(logs))} className="text-xs bg-[#111] border border-[#333] px-2 py-1 text-white">Find error</button></div>
      <div className="flex gap-2 mt-2 text-xs">{["All","Vercel","Supabase","Stripe","Localhost"].map(t=> <button key={t} onClick={()=>setTab(t)} className={"px-2 py-1 border "+(tab===t?"border-[#00FF88] text-[#00FF88]":"border-[#333] text-[#666]")}>{t}</button>)}</div>
      <div className="mt-3 bg-[#050505] font-mono text- h-40 overflow-y-auto border border-[#111] p-2">{logs.filter((l:any)=> tab==="All" || l.source===tab).map((l:any,i:number)=> <div key={i} className={l.level==="error"?"text-[#ff0033]": l.level==="warn"?"text-[#ffaa00]":"text-[#888]"}>{l.ts} [{l.source}] {l.msg}</div>)}</div>
      {hint && <div className="mt-2 text-xs text-[#00FF88]">{hint}</div>}
    </div>
  )
}
