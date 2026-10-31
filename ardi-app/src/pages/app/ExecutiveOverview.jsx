import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Boxes,
  Truck,
  RotateCw,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { api } from '../../services/api'

const COLORS = ['#3b82f6', '#14b8a6', '#f59e0b', '#ef4444']

export default function ExecutiveOverview() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getDashboardSummary()
      .then(data => setSummary(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !summary) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs">
        <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
        Loading Executive Intelligence Overview...
      </div>
    )
  }

  const kpis = [
    { label: 'Total Revenue', value: `₹${(summary.total_revenue_inr / 1000000).toFixed(2)}M`, sub: `Gross Margin: ${summary.gross_margin_pct}%`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Gross Profit', value: `₹${(summary.total_gross_profit_inr / 1000000).toFixed(2)}M`, sub: 'Realized gross profit', icon: TrendingUp, color: 'text-blue-400' },
    { label: 'Stockout Risk SKUs', value: summary.stockout_risk_skus, sub: 'Inventory <= reorder point', icon: AlertTriangle, color: 'text-rose-400' },
    { label: 'Expiry Risk SKUs', value: summary.expiry_risk_skus, sub: 'Perishables cover > shelf life', icon: Boxes, color: 'text-amber-400' },
    { label: 'Wastage Cost', value: `₹${(summary.wastage_cost_inr / 100000).toFixed(2)} Lakh`, sub: 'Synthetic V3 recalibrated', icon: TrendingDown, color: 'text-slate-300' },
    { label: 'Total Stores & SKUs', value: `${summary.total_stores} Stores`, sub: `${summary.total_skus} Active Products`, icon: Building2, color: 'text-teal-400' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <LayoutDashboard className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">Executive Overview</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Macro operational performance, city cluster health, and active stock exposure.
          </p>
        </div>
        <div className="text-right text-xs">
          <span className="text-slate-500 block text-[10px]">Active Snapshot Date</span>
          <span className="font-mono text-teal-400 font-bold">{summary.snapshot_date}</span>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k, i) => {
          const Icon = k.icon
          return (
            <div key={i} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider">{k.label}</span>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <div className="text-lg font-bold font-mono text-white">{k.value}</div>
              <div className="text-[10px] text-slate-400">{k.sub}</div>
            </div>
          )
        })}
      </div>

      {/* City Breakdown & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">City Cluster Performance</h2>
            <span className="text-[10px] text-slate-500">Revenue (INR) & Stockout Rates</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.city_performance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="city" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }}
                  formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue_inr" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Store Distribution by City</h2>
          <div className="space-y-3">
            {summary.city_performance?.map((c, i) => (
              <div key={c.city} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{c.city}</span>
                  <span className="font-mono text-slate-400">{c.stores} Stores</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Stockout Rate: <span className="text-rose-400 font-bold">{c.stockout_rate_pct}%</span></span>
                  <span className="text-emerald-400">₹{(c.revenue_inr / 100000).toFixed(1)}L Rev</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 text-[11px] text-slate-300">
            <span className="font-bold text-blue-400 block mb-1">Intelligence Status: Active</span>
            7 specialized agents continuously observing sales velocity, weather forecasts, and supplier PO fill rates across all 20 stores.
          </div>
        </div>
      </div>
    </div>
  )
}
