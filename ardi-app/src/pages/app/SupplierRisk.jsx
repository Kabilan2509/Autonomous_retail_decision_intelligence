import React, { useState, useEffect } from 'react'
import {
  Truck,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Search,
  ExternalLink
} from 'lucide-react'
import { api } from '../../services/api'

export default function SupplierRisk() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSupplierMetrics()
      .then(data => setSuppliers(data.suppliers || []))
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
              <Truck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">Supplier Intelligence & Procurement Risk</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supplier reliability scores, delivery delay metrics, fill rates, and verified contract backup suppliers.
          </p>
        </div>
      </div>

      {/* Grid of Suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 p-16 text-center text-xs text-slate-500">
            <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
            Evaluating supplier historical fill rates...
          </div>
        ) : (
          suppliers.map(sup => {
            const isCritical = sup.supplier_risk_score > 0.35
            return (
              <div
                key={sup.supplier_id}
                className={`p-4 rounded-xl border bg-slate-900 ${
                  isCritical ? 'border-rose-500/50' : 'border-slate-800'
                } space-y-3`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-teal-400 font-bold">{sup.supplier_id}</span>
                    <h3 className="font-bold text-sm text-white">{sup.supplier_name}</h3>
                    <span className="text-[11px] text-slate-400">{sup.supplier_type}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isCritical ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {sup.status}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase block">Fill Rate</span>
                    <span className="font-mono font-bold text-white">{(sup.fill_rate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase block">Delay Rate</span>
                    <span className={`font-mono font-bold ${sup.delay_rate > 0.15 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {(sup.delay_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase block">Lead Time</span>
                    <span className="font-mono font-bold text-white">{sup.base_lead_time_days}d</span>
                  </div>
                </div>

                {/* Recommendation */}
                <div className="p-2.5 rounded bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-300 leading-snug">
                  <span className="font-bold text-slate-400 block text-[10px] uppercase">Policy Guidance:</span>
                  {sup.recommendation}
                </div>

                <div className="text-[10px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-800/80">
                  <span>Supplies: {sup.affected_skus?.length || 0} SKUs</span>
                  <span className="font-mono">Risk: {(sup.supplier_risk_score * 100).toFixed(0)}/100</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
