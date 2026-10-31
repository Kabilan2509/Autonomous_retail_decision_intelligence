import React, { useState, useEffect } from 'react'
import {
  ArrowLeftRight,
  Truck,
  RotateCw,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Snowflake
} from 'lucide-react'
import { api } from '../../services/api'

export default function LateralLogistics() {
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getTransfers()
      .then(data => setTransfers(data.transfers || []))
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
              <ArrowLeftRight className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">Lateral Store Transshipment & Logistics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Google OR-Tools multi-store vehicle routing and stock balancing to neutralize stockouts without supplier lead time.
          </p>
        </div>
      </div>

      {/* Transfers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 p-16 text-center text-xs text-slate-500">
            <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
            Solving OR-Tools transshipment linear program...
          </div>
        ) : transfers.length === 0 ? (
          <div className="col-span-3 p-16 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-xs">
            No lateral transfers currently needed. All store inventories balanced within safety thresholds.
          </div>
        ) : (
          transfers.map(tr => (
            <div key={tr.transfer_id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] text-teal-400 font-bold">{tr.transfer_id}</span>
                  <h3 className="font-bold text-sm text-white">{tr.product_name}</h3>
                  <span className="text-[10px] font-mono text-slate-500">{tr.sku_id}</span>
                </div>
                {tr.cold_chain_required && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                    <Snowflake className="w-3 h-3 text-blue-400" /> Cold Chain
                  </span>
                )}
              </div>

              {/* Source & Destination Route */}
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Surplus Store (From):</span>
                  <span className="font-semibold text-emerald-400">{tr.from_store_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Shortage Store (To):</span>
                  <span className="font-semibold text-rose-400">{tr.to_store_name}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                  <span className="text-slate-400">Transfer Quantity:</span>
                  <span className="font-mono font-bold text-white text-xs">{tr.quantity_units} units</span>
                </div>
              </div>

              {/* Distance and Cost */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-950/40 border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block">Distance</span>
                  <span className="font-mono font-bold text-white">{tr.distance_km} km</span>
                </div>
                <div className="p-2 rounded bg-slate-950/40 border border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block">Estimated Cost</span>
                  <span className="font-mono font-bold text-white">₹{tr.transfer_cost_inr}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-snug">
                {tr.rationale}
              </p>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Solver: Google OR-Tools</span>
                <span className="text-emerald-400 font-semibold">Feasible</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
