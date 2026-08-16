"use client"
import { useEffect, useState } from "react"
import { checkGhostClipboard } from "@/lib/ghost"
export default function GhostCard({ onGhostEnv }: { onGhostEnv: (txt:string)=>void }){
  const [found,setFound]=useState<string|null>(null);
  useEffect(()=>{ const i=setInterval(async()=>{ const g=await checkGhostClipboard(); if(g) setFound(g); }, 2000); return ()=>clearInterval(i) },[]);
  if(!found) return null;
  return (
    <div className="border border-[#ff00ff] bg-[#ff00ff]/10 p-3 animate-pulse">
      <div className="text-[#ff00ff] text-xs font-bold">GHOST detected .env in clipboard</div>
      <button onClick={()=>{ onGhostEnv(found); setFound(null); }} className="mt-2 bg-[#ff00ff] text-black px-3 py-1 text-xs font-bold">Inject Ghost .env</button>
    </div>
  )
}
