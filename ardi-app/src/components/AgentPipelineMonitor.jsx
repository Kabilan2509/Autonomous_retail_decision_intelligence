import React, { useState, useEffect } from 'react'
import {
  BrainCircuit,
  TrendingUp,
  Boxes,
  Truck,
  DollarSign,
  Globe2,
  ArrowLeftRight,
  LineChart,
  CheckCircle2,
  Activity,
  Layers,
  Cpu
} from 'lucide-react'
import { api } from '../services/api'

export default function AgentPipelineMonitor() {
  const [agents, setAgents] = useState([])

  useEffect(() => {
    api.getAgentsStatus()
      .then(data => setAgents(data.agents || []))
      .catch(console.error)
  }, [])

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-teal-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Multi-Agent Intelligence Pipeline & Model Registry
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          All 9 Specialized Agents Active
        </div>
      </div>

      {/* Intelligence Cycle Ribbon */}
      <div className="grid grid-cols-7 gap-1 p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[10px] text-center font-mono font-bold">
        <span className="text-blue-400">1. OBSERVE</span>
        <span className="text-slate-600">→</span>
        <span className="text-teal-400">2. PREDICT</span>
        <span className="text-slate-600">→</span>
        <span className="text-purple-400">3. REASON</span>
        <span className="text-slate-600">→</span>
        <span className="text-emerald-400">4. DECIDE</span>
        <span className="text-slate-600">→</span>
        <span className="text-amber-400">5. ACT</span>
        <span className="text-slate-600">→</span>
        <span className="text-cyan-400">6. MEASURE</span>
        <span className="text-slate-600">→</span>
        <span className="text-indigo-400">7. ADAPT</span>
      </div>

      {/* Grid of Agents */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {agents.map(ag => (
          <div key={ag.id} className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-teal-400">{ag.id}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-2.5 h-2.5" /> {ag.status}
              </span>
            </div>
            <h4 className="font-bold text-white text-xs">{ag.name}</h4>
            <div className="text-[10px] font-mono text-blue-400 font-semibold">{ag.model}</div>
            <p className="text-[11px] text-slate-400 leading-snug">{ag.role}</p>
            <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Latency: ~{ag.latency_ms}ms</span>
              <span>{ag.coverage}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
