import React, { useState, useEffect } from 'react'
import {
  LineChart,
  ShieldCheck,
  RotateCw,
  TrendingUp,
  CheckCircle2,
  Scale,
  Award,
  Layers
} from 'lucide-react'
import { api } from '../../services/api'

export default function AuditCenter() {
  const [kpiData, setKpiData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getKPIs()
      .then(data => setKpiData(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !kpiData) {
    return (
      <div className="p-16 text-center text-xs text-slate-500">
        <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
        Loading Policy Audit Benchmarks...
      </div>
    )
  }

  const comp = kpiData.policy_comparison || {}
  const b0 = comp.baseline_policy_b0 || {}
  const agent = comp.agent_assisted_policy || {}
  const delta = comp.relative_improvement || {}

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <LineChart className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">KPI & Baseline Policy Audit Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical benchmarking of ARDI Multi-Agent Decision Intelligence against standard retail baseline policies.
          </p>
        </div>
      </div>

      {/* Controlled Policy Comparison Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-teal-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Controlled Benchmark: Fixed Reorder Policy (B0) vs ARDI Autonomous System
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Chronological Holdout Split</span>
        </div>

        {/* Head-to-Head Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Baseline B0 */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Benchmark Policy</span>
                <h3 className="font-bold text-sm text-slate-300">{b0.name}</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                Static Heuristic
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Stockout Rate</span>
                <span className="text-base font-bold font-mono text-rose-400">{b0.stockout_rate_pct}%</span>
              </div>
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Lost Sales (Units)</span>
                <span className="text-base font-bold font-mono text-slate-300">{b0.lost_sales_units?.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Wastage Cost</span>
                <span className="text-base font-bold font-mono text-slate-300">₹{(b0.wastage_cost_inr / 100000).toFixed(1)}L</span>
              </div>
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block">Gross Margin</span>
                <span className="text-base font-bold font-mono text-slate-300">{b0.gross_margin_pct}%</span>
              </div>
            </div>
          </div>

          {/* ARDI Multi-Agent */}
          <div className="p-5 rounded-xl bg-blue-950/20 border border-blue-500/40 space-y-4 shadow-lg ring-1 ring-blue-500/20">
            <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
              <div>
                <span className="text-[10px] text-blue-400 uppercase font-mono font-bold block">Autonomous Agent Policy</span>
                <h3 className="font-bold text-sm text-white">{agent.name}</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                Autonomous + Human Gate
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded bg-slate-950/80 border border-blue-900/40">
                <span className="text-[10px] text-slate-400 uppercase block">Stockout Rate</span>
                <span className="text-base font-bold font-mono text-emerald-400">{agent.stockout_rate_pct}%</span>
              </div>
              <div className="p-3 rounded bg-slate-950/80 border border-blue-900/40">
                <span className="text-[10px] text-slate-400 uppercase block">Lost Sales (Units)</span>
                <span className="text-base font-bold font-mono text-teal-400">{agent.lost_sales_units?.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded bg-slate-950/80 border border-blue-900/40">
                <span className="text-[10px] text-slate-400 uppercase block">Wastage Cost</span>
                <span className="text-base font-bold font-mono text-teal-400">₹{(agent.wastage_cost_inr / 100000).toFixed(1)}L</span>
              </div>
              <div className="p-3 rounded bg-slate-950/80 border border-blue-900/40">
                <span className="text-[10px] text-slate-400 uppercase block">Gross Margin</span>
                <span className="text-base font-bold font-mono text-emerald-400">{agent.gross_margin_pct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quantified Business Deltas */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            Measured Real-World Business Lift (Test Period Evaluation)
          </span>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Stockout Reduction</span>
              <span className="text-lg font-bold font-mono text-emerald-400">-{delta.stockout_reduction_pct}%</span>
            </div>
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Lost Sales Rescued</span>
              <span className="text-lg font-bold font-mono text-white">+{delta.lost_sales_saved_units?.toLocaleString()} units</span>
            </div>
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Wastage Reduction</span>
              <span className="text-lg font-bold font-mono text-teal-400">-{delta.wastage_cost_reduction_pct}%</span>
            </div>
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Margin Expansion</span>
              <span className="text-lg font-bold font-mono text-emerald-400">+{delta.gross_margin_lift_bps} bps</span>
            </div>
          </div>
        </div>

        {/* Responsible AI Audit Checklist */}
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-2">
          <span className="font-bold text-slate-300 block uppercase text-[10px]">Responsible AI Governance Checklist</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-400 text-[11px]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Zero-hallucination policy: All quantities calculated by deterministic HiGHS / OR-Tools</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Mathematical safety bands: Distribution-free MAPIE conformal coverage</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Hard margin floors: Never sells below approved procurement cost + 10%</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Full provenance: Reversible simulated execution with human approval gate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
