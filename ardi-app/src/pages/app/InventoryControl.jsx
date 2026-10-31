import React, { useState, useEffect } from 'react'
import {
  Boxes,
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  ShieldAlert,
  Calendar,
  Layers
} from 'lucide-react'
import { api } from '../../services/api'

export default function InventoryControl() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterRiskOnly, setFilterRiskOnly] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    api.getInventorySnapshot(null, null, 100)
      .then(data => setItems(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter(it => {
    if (filterRiskOnly && it.on_hand_units > it.reorder_point_units && !it.expiry_risk_flag) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchName = (it.product_name || '').toLowerCase().includes(term)
      const matchStore = (it.store_name || '').toLowerCase().includes(term)
      const matchCat = (it.category || '').toLowerCase().includes(term)
      if (!matchName && !matchStore && !matchCat) return false
    }
    return true
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Boxes className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">Inventory Intelligence & Risk Control</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Store-level on-hand positions, days of cover, reorder triggers, and expiry risk monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterRiskOnly(!filterRiskOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filterRiskOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {filterRiskOnly ? 'Showing Risks Only' : 'Filter Risks Only'}
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Product, Store, or Category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-slate-400">
          Showing <span className="text-white font-bold">{filtered.length}</span> items
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500">
            <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-400" />
            Loading real-time inventory ledger...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Store</th>
                  <th className="py-3 px-4">SKU / Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">On Hand</th>
                  <th className="py-3 px-4 text-right">Reorder Pt</th>
                  <th className="py-3 px-4 text-right">Target</th>
                  <th className="py-3 px-4 text-right">Cover (Days)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((it, idx) => {
                  const isStockout = it.on_hand_units <= it.reorder_point_units
                  const isExpiry = it.expiry_risk_flag
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">
                        {it.store_name}
                        <span className="block text-[10px] text-teal-400">{it.location}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white block">{it.product_name}</span>
                        <span className="font-mono text-[10px] text-slate-500">{it.sku_id}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{it.category}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">{it.on_hand_units}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">{it.reorder_point_units}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">{it.target_stock_units}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        <span className={`${it.days_of_cover < 2 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                          {it.days_of_cover.toFixed(1)}d
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isStockout && (
                          <span className="inline-block px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">
                            STOCKOUT RISK
                          </span>
                        )}
                        {isExpiry && (
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20 ml-1">
                            EXPIRY RISK
                          </span>
                        )}
                        {!isStockout && !isExpiry && (
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                            HEALTHY
                          </span>
                        )}
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
