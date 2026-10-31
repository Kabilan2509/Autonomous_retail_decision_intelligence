import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingDown,
  ShieldCheck,
  RotateCw,
  Search,
  Percent,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { api } from '../../services/api'

export default function PricingMargin() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getPricingAnalysis()
      .then(data => setItems(data.recommendations || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <DollarSign className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">Pricing Intelligence & Margin Protection</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Microsoft EconML (DRLearner) causal discount optimization with non-negotiable 10% gross margin floors.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500">
            <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
            Evaluating causal price elasticity and competitor gaps...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">SKU / Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Cost</th>
                  <th className="py-3 px-4 text-right">Our Price</th>
                  <th className="py-3 px-4 text-right">Competitor</th>
                  <th className="py-3 px-4 text-right">Floor Price</th>
                  <th className="py-3 px-4 text-right">Margin</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((it, idx) => {
                  const isAction = it.action !== 'NO_ACTION'
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white block">{it.product_name}</span>
                        <span className="font-mono text-[10px] text-slate-500">{it.sku_id}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{it.category}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">₹{it.cost.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">₹{it.current_price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">₹{it.competitor_price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400">₹{it.min_allowed_price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        <span className="text-emerald-400 font-bold">{(it.current_margin_pct * 100).toFixed(0)}%</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          it.action === 'MARKDOWN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          it.action === 'PRICE_REVIEW' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {it.action} {it.suggested_discount_pct > 0 ? `(-${(it.suggested_discount_pct * 100).toFixed(0)}%)` : ''}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
