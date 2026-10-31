import React, { useState, useMemo } from 'react'
import {
  Warehouse,
  MapPin,
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  Truck,
  X,
  AlertTriangle,
  Clock,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Zap,
  BarChart3,
  Activity,
  Store,
  ArrowDownToLine,
  Building2,
  ChevronRight,
} from 'lucide-react'
import { clsx } from 'clsx'
import useAppStore from '../../store/useStore'

// ─── ETA Distance Matrix ──────────────────────────────────────────────────────

const ETA_MAP = {
  'Chennai-Coimbatore':   { time: '6h 30m',  km: '495 km', mode: 'Road' },
  'Chennai-Bangalore':    { time: '6h 00m',  km: '346 km', mode: 'Road' },
  'Coimbatore-Chennai':   { time: '6h 30m',  km: '495 km', mode: 'Road' },
  'Coimbatore-Bangalore': { time: '4h 30m',  km: '248 km', mode: 'Road' },
  'Bangalore-Chennai':    { time: '6h 00m',  km: '346 km', mode: 'Road' },
  'Bangalore-Coimbatore': { time: '4h 30m',  km: '248 km', mode: 'Road' },
  'Intra-Chennai':        { time: '~45 min', km: '~28 km', mode: 'Local Van' },
  'Intra-Bangalore':      { time: '~1h 00m', km: '~35 km', mode: 'Local Van' },
  'Intra-Coimbatore':     { time: '~30 min', km: '~15 km', mode: 'Local Van' },
}

function getEta(sourceCityName, destCityName, isIntra) {
  if (!sourceCityName) return null
  if (isIntra) return ETA_MAP[`Intra-${sourceCityName}`] ?? { time: '~1h', km: 'Local', mode: 'Local Van' }
  const key = `${sourceCityName}-${destCityName}`
  return ETA_MAP[key] ?? { time: '~4h 00m', km: 'N/A', mode: 'Road' }
}

// ─── Velocity helpers ─────────────────────────────────────────────────────────

function VelocityIcon({ velocity }) {
  if (velocity === 'High')     return <TrendingUp    className="w-3.5 h-3.5 text-emerald-400" />
  if (velocity === 'Stagnant') return <TrendingDown  className="w-3.5 h-3.5 text-red-400" />
  if (velocity === 'Low')      return <TrendingDown  className="w-3.5 h-3.5 text-amber-400" />
  return                              <Minus         className="w-3.5 h-3.5 text-slate-500" />
}

function velocityColor(v) {
  if (v === 'High')     return 'text-emerald-400'
  if (v === 'Stagnant') return 'text-red-400'
  if (v === 'Low')      return 'text-amber-400'
  return 'text-slate-400'
}

// ─── Status Badge (table) ─────────────────────────────────────────────────────

function StockStatusBadge({ item }) {
  const isCritical  = item.sales_velocity === 'High'     && item.stock_level < 50
  const isOverstock = item.sales_velocity === 'Stagnant' && item.stock_level > 150

  if (isCritical) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold
                     bg-red-500/15 text-red-300 border border-red-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
      Critical
    </span>
  )
  if (isOverstock) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold
                     bg-amber-500/15 text-amber-300 border border-amber-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
      Overstock
    </span>
  )
  if (item.stock_level < 100) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold
                     bg-slate-800 text-slate-400 border border-slate-700">
      Normal
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold
                     bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
      Healthy
    </span>
  )
}

// ─── Circular Health Ring (SVG) ───────────────────────────────────────────────

function HealthRing({ pct, size = 56, stroke = 5 }) {
  const r   = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(1, pct / 100))
  const color =
    pct < 30 ? '#f87171'   // red
    : pct < 60 ? '#fbbf24' // amber
    : '#34d399'            // emerald

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-bold text-white leading-none">{Math.round(pct)}%</span>
      </div>
    </div>
  )
}

// ─── Warehouse Inventory Table Row ────────────────────────────────────────────

function WarehouseRow({ item, index, onTransfer, sourceName, sourceCityId, sourceCityName, destinations }) {
  const isOverstock = item.sales_velocity === 'Stagnant' && item.stock_level > 150
  const pct = Math.min(100, (item.stock_level / 8000) * 100)
  const barColor =
    item.stock_level < 500  ? 'bg-red-500'
    : item.stock_level < 2000 ? 'bg-amber-500'
    : 'bg-emerald-500'

  return (
    <tr className="group border-b border-slate-800/60 hover:bg-slate-800/50 transition-colors duration-150">
      <td className="px-5 py-3.5 w-10">
        <span className="text-[11px] font-mono text-slate-600">{String(index + 1).padStart(2, '0')}</span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <Package className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-sm font-semibold text-white">{item.sku}</span>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-bold text-white">{item.stock_level.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500">units</span>
          </div>
          <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className={clsx('h-full rounded-full', barColor)} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5"><StockStatusBadge item={item} /></td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="text-xs text-slate-400">
            {new Date(item.date_arrived).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <VelocityIcon velocity={item.sales_velocity} />
          <span className={clsx('text-xs font-semibold', velocityColor(item.sales_velocity))}>
            {item.sales_velocity}
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5">
        {isOverstock ? (
          <button
            onClick={() => onTransfer({ item, sourceName, sourceCityId, sourceCityName, destinations })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold
                       bg-amber-500/15 text-amber-300 border border-amber-500/30
                       hover:bg-amber-500/25 hover:border-amber-400/50 transition-all duration-200 active:scale-95"
          >
            <Truck className="w-3.5 h-3.5" />
            Transfer
          </button>
        ) : (
          <span className="text-[11px] text-slate-700 px-3 py-1.5">—</span>
        )}
      </td>
    </tr>
  )
}

// ─── Store Spoke Card ─────────────────────────────────────────────────────────

function StoreCard({ store, cityName, onClick }) {
  const criticalSkus  = store.inventory.filter(i => i.sales_velocity === 'High' && i.stock_level < 50)
  const overstockSkus = store.inventory.filter(i => i.sales_velocity === 'Stagnant' && i.stock_level > 150)
  const totalStock    = store.inventory.reduce((s, i) => s + i.stock_level, 0)
  const maxStock      = store.inventory.length * 500   // rough healthy ceiling
  const healthPct     = Math.min(100, (totalStock / maxStock) * 100)

  const hasCritical  = criticalSkus.length  > 0
  const hasOverstock = overstockSkus.length > 0

  // Top alerts to show
  const alerts = [
    ...criticalSkus.slice(0, 2).map(i  => ({ sku: i.sku, type: 'critical',  stock: i.stock_level })),
    ...overstockSkus.slice(0, 2).map(i => ({ sku: i.sku, type: 'overstock', stock: i.stock_level })),
  ].slice(0, 2)

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full text-left p-4 rounded-xl border transition-all duration-200 group',
        'bg-slate-900/60 hover:bg-slate-800/70',
        hasCritical  ? 'border-red-500/30 hover:border-red-400/50'
        : hasOverstock ? 'border-amber-500/30 hover:border-amber-400/50'
        : 'border-slate-800 hover:border-slate-700',
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={clsx(
            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
            hasCritical  ? 'bg-red-500/15 border border-red-500/30'
            : hasOverstock ? 'bg-amber-500/15 border border-amber-500/30'
            : 'bg-slate-800 border border-slate-700',
          )}>
            <Store className={clsx(
              'w-3.5 h-3.5',
              hasCritical  ? 'text-red-400'
              : hasOverstock ? 'text-amber-400'
              : 'text-slate-400',
            )} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{store.area}</p>
            <p className="text-[10px] text-slate-500 truncate">₹{(store.daily_revenue / 1000).toFixed(0)}k/day</p>
          </div>
        </div>

        {/* Health ring */}
        <HealthRing pct={healthPct} size={48} stroke={4} />
      </div>

      {/* Alert SKUs */}
      {alerts.length > 0 ? (
        <div className="space-y-1.5">
          {alerts.map((a, idx) => (
            <div key={idx} className={clsx(
              'flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold',
              a.type === 'critical'
                ? 'bg-red-500/10 text-red-300'
                : 'bg-amber-500/10 text-amber-300',
            )}>
              {a.type === 'critical'
                ? <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
                : <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              }
              <span className="truncate">{a.sku}</span>
              <span className="ml-auto font-mono shrink-0">{a.stock}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          Stock healthy
        </div>
      )}

      {/* View arrow */}
      <div className="mt-3 flex items-center justify-end">
        <span className="text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors flex items-center gap-0.5">
          View inventory <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  )
}

// ─── Transfer Modal ───────────────────────────────────────────────────────────

function TransferModal({ transferCtx, onClose, onConfirm }) {
  const { item, sourceName, sourceCityId, sourceCityName, destinations } = transferCtx

  const [destId, setDestId]     = useState(destinations[0]?.id ?? '')
  const [quantity, setQuantity] = useState(Math.min(100, item.stock_level))
  const [confirmed, setConfirmed] = useState(false)

  const destObj = destinations.find(d => d.id === destId) ?? destinations[0]
  const isIntra = destObj?.cityId === sourceCityId
  const eta     = getEta(sourceCityName, destObj?.cityName, isIntra)

  const handleConfirm = () => {
    setConfirmed(true)
    setTimeout(() => {
      onConfirm({ sku: item.sku, quantity, from: sourceName, to: destObj?.label ?? destObj?.name })
    }, 1200)
  }

  // Group destinations
  const localStores      = destinations.filter(d => d.group === 'local_store')
  const cityWarehouse    = destinations.filter(d => d.group === 'city_warehouse')
  const externalWarehouses = destinations.filter(d => d.group === 'external_warehouse')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg mx-4 glass-panel shadow-2xl shadow-black/60 border border-slate-700/80"
        style={{ background: 'rgba(15,23,42,0.95)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 rounded-t-xl" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Transfer Stock</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Manual inventory redistribution</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* SKU info */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Selected SKU</p>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700">
              <Package className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-sm font-semibold text-white">{item.sku}</span>
              <span className="ml-auto text-xs text-slate-500 font-mono">{item.stock_level.toLocaleString()} available</span>
            </div>
          </div>

          {/* Route */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Transfer Route</p>
            <div className="flex items-center gap-2">
              {/* From */}
              <div className="flex-1 px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-center">
                <p className="text-[10px] text-slate-500 mb-0.5">From</p>
                <p className="text-sm font-bold text-white truncate">{sourceName}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
              {/* To: grouped optgroup select */}
              <div className="flex-1">
                <select
                  value={destId}
                  onChange={e => setDestId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700
                             text-white text-sm font-semibold
                             focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/60
                             transition-all cursor-pointer"
                >
                  {localStores.length > 0 && (
                    <optgroup label="Local Stores (Same City)">
                      {localStores.map(d => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </optgroup>
                  )}
                  {cityWarehouse.length > 0 && (
                    <optgroup label="City Warehouse">
                      {cityWarehouse.map(d => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </optgroup>
                  )}
                  {externalWarehouses.length > 0 && (
                    <optgroup label="External Warehouses">
                      {externalWarehouses.map(d => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Transfer type + ETA */}
          <div className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-xl border',
            isIntra
              ? 'bg-blue-500/10 border-blue-500/20'
              : 'bg-violet-500/10 border-violet-500/20',
          )}>
            <Clock className={clsx('w-4 h-4 shrink-0', isIntra ? 'text-blue-400' : 'text-violet-400')} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                {isIntra ? 'Intra-City Transit' : 'Inter-City Transit'}
              </p>
              <p className="text-sm font-bold text-white mt-0.5 truncate">
                {sourceCityName} → {destObj?.cityName ?? destObj?.name}
                <span className="mx-2 text-slate-600">·</span>
                <span className={isIntra ? 'text-blue-300' : 'text-violet-300'}>{eta?.time ?? '—'}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-slate-500">{eta?.mode}</p>
              <p className="text-xs font-semibold text-slate-400">{eta?.km}</p>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Transfer Quantity</p>
              <span className="text-[11px] text-slate-500">Max: {item.stock_level.toLocaleString()}</span>
            </div>
            <input
              type="number" min={1} max={item.stock_level} value={quantity}
              onChange={e => setQuantity(Math.max(1, Math.min(item.stock_level, Number(e.target.value))))}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700
                         text-white text-center text-lg font-bold
                         focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/60 transition-all"
            />
            <input
              type="range" min={1} max={item.stock_level} value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-full mt-2 accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
              <span>1</span>
              <span>{Math.round(item.stock_level / 2).toLocaleString()}</span>
              <span>{item.stock_level.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold
                       border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmed || quantity < 1}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all active:scale-95',
              confirmed
                ? 'bg-emerald-600/80 text-white border border-emerald-500/40'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25',
            )}
          >
            {confirmed ? (
              <><CheckCircle2 className="w-4 h-4" /> Transfer Queued!</>
            ) : (
              <><Truck className="w-4 h-4" /> Confirm Transfer</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Summary Stat Card ────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="glass-panel px-4 py-4 flex items-center gap-3">
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-lg font-bold text-white leading-none">{value}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Store Detail Drawer (slide-in panel) ─────────────────────────────────────

function StoreDetailPanel({ store, cityName, onClose, onTransfer, destinations }) {
  if (!store) return null

  const criticalCount  = store.inventory.filter(i => i.sales_velocity === 'High'     && i.stock_level < 50).length
  const overstockCount = store.inventory.filter(i => i.sales_velocity === 'Stagnant' && i.stock_level > 150).length

  return (
    <div className="mt-6 glass-panel overflow-hidden border border-blue-500/20">
      {/* Accent */}
      <div className="h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Store className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{store.area} — {store.name}</p>
            <p className="text-[11px] text-slate-500">{store.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <span className="text-[11px] font-bold text-red-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              {criticalCount} critical
            </span>
          )}
          {overstockCount > 0 && (
            <span className="text-[11px] font-bold text-amber-400">{overstockCount} overstock</span>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inventory table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-5 py-3 text-left w-10" />
              <th className="px-4 py-3 text-left"><span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">SKU</span></th>
              <th className="px-4 py-3 text-left"><span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Stock</span></th>
              <th className="px-4 py-3 text-left"><span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Status</span></th>
              <th className="px-4 py-3 text-left"><span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Arrived</span></th>
              <th className="px-4 py-3 text-left"><span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Velocity</span></th>
              <th className="px-4 py-3 text-left"><span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {store.inventory.map((item, idx) => (
              <WarehouseRow
                key={item.sku}
                item={item}
                index={idx}
                onTransfer={ctx => onTransfer(ctx)}
                sourceName={store.name}
                sourceCityId={store.city_id}
                sourceCityName={cityName}
                destinations={destinations}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main Warehouses Page ─────────────────────────────────────────────────────

export default function Warehouses() {
  const activeCity          = useAppStore(s => s.activeCity)
  const activeStore         = useAppStore(s => s.activeStore)
  const cities              = useAppStore(s => s.cities)
  const warehouses          = useAppStore(s => s.warehouses)
  const storesAll           = useAppStore(s => s.stores)

  const cityObj   = cities.find(c => c.id === activeCity) ?? cities[0]
  const warehouse = warehouses.find(w => w.city_id === activeCity) ?? warehouses[0]
  const cityStores = useMemo(
    () => storesAll.filter(s => s.city_id === activeCity),
    [storesAll, activeCity],
  )

  // Selected store for detail panel
  const [selectedStoreId, setSelectedStoreId] = useState(null)
  const selectedStore = selectedStoreId ? cityStores.find(s => s.id === selectedStoreId) : null

  // Transfer modal context
  const [transferCtx, setTransferCtx]   = useState(null)
  const [transfers, setTransfers]       = useState([])

  // ── Build transfer destinations ─────────────────────────────────────────────
  const buildDestinations = (sourceName, sourceCityId) =>
    [
      // Local stores (same city) — exclude self by name
      ...cityStores
        .filter(s => s.name !== sourceName)
        .map(s => ({
          id:    s.id,
          name:  s.name,
          label: `${s.area} (${s.name})`,
          cityId: s.city_id,
          cityName: cityObj.name,
          group: 'local_store',
        })),
      // City warehouse itself (if source is a store)
      ...( sourceName !== warehouse.store_name ? [{
        id:      warehouse.warehouse_id,
        name:    warehouse.store_name,
        label:   `${warehouse.store_name} Warehouse`,
        cityId:  warehouse.city_id,
        cityName: cityObj.name,
        group:   'city_warehouse',
      }] : [] ),
      // External warehouses (other cities)
      ...warehouses
        .filter(w => w.city_id !== activeCity)
        .map(w => {
          const wCity = cities.find(c => c.id === w.city_id)
          return {
            id:      w.warehouse_id,
            name:    w.store_name,
            label:   `${wCity?.name ?? w.store_name} Warehouse`,
            cityId:  w.city_id,
            cityName: wCity?.name ?? w.store_name,
            group:   'external_warehouse',
          }
        }),
    ]

  const warehouseDests = buildDestinations(warehouse.store_name, warehouse.city_id)

  const handleTransferConfirm = transfer => {
    setTransfers(prev => [transfer, ...prev])
    setTransferCtx(null)
  }

  // Summary stats across all stores in city
  const cityTotalStock   = useMemo(() =>
    cityStores.reduce((sum, s) => sum + s.inventory.reduce((a, i) => a + i.stock_level, 0), 0),
    [cityStores])
  const cityTotalRevenue = useMemo(() =>
    cityStores.reduce((sum, s) => sum + s.daily_revenue, 0), [cityStores])
  const cityCritical     = useMemo(() =>
    cityStores.reduce((sum, s) => sum + s.inventory.filter(i => i.sales_velocity === 'High' && i.stock_level < 50).length, 0),
    [cityStores])
  const cityOverstock    = useMemo(() =>
    cityStores.reduce((sum, s) => sum + s.inventory.filter(i => i.sales_velocity === 'Stagnant' && i.stock_level > 150).length, 0),
    [cityStores])

  return (
    <div className="min-h-full animate-fade-in">

      {/* ── Page heading ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Warehouse className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Warehouse Management</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Hub & Spoke Inventory</h1>
        <p className="text-sm text-slate-400 mt-1">
          <span className="text-blue-400 font-semibold">{cityObj.name}</span>
          <span className="text-slate-600 mx-1.5">·</span>
          <span className="text-slate-500">{warehouse.location}</span>
          <span className="text-slate-600 mx-1.5">·</span>
          <span className="text-emerald-400 font-semibold">{cityStores.length} store spokes</span>
        </p>
      </div>

      {/* ── City summary stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Package}
          label="Network Stock Units"
          value={cityTotalStock.toLocaleString()}
          color="bg-gradient-to-br from-purple-500 to-indigo-600"
        />
        <StatCard
          icon={Activity}
          label="City Daily Revenue"
          value={`₹${(cityTotalRevenue / 1000).toFixed(0)}k`}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="Critical SKUs"
          value={cityCritical}
          sub={cityCritical > 0 ? 'Immediate action needed' : 'All clear'}
          color="bg-gradient-to-br from-red-500 to-rose-600"
        />
        <StatCard
          icon={BarChart3}
          label="Overstock SKUs"
          value={cityOverstock}
          sub={cityOverstock > 0 ? 'Transfer recommended' : 'Balanced'}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>

      {/* ── Transfer log ──────────────────────────────────────────────────── */}
      {transfers.length > 0 && (
        <div className="mb-6 space-y-2">
          {transfers.slice(0, 3).map((t, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300">
                <span className="font-bold">{t.quantity} units</span> of{' '}
                <span className="font-bold">{t.sku}</span> queued:
                {' '}<span className="font-bold">{t.from}</span> →{' '}
                <span className="font-bold">{t.to}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── THE HUB: City Warehouse ────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="mb-8">

        {/* Hub label */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Building2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              The Hub · {warehouse.warehouse_id}
            </span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            {warehouse.utilisation_pct}% capacity used
          </div>
        </div>

        {/* Warehouse glassmorphism card */}
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-purple-500/20 overflow-hidden shadow-xl shadow-purple-500/5">

          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-purple-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Warehouse className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-white">{warehouse.store_name} Central Warehouse</p>
                <p className="text-xs text-slate-400">{warehouse.location}</p>
              </div>
            </div>

            {/* Capacity ring */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500">Capacity</p>
                <p className="text-sm font-bold text-white">{warehouse.capacity_units.toLocaleString()} units</p>
              </div>
              <HealthRing pct={warehouse.utilisation_pct} size={60} stroke={5} />
            </div>
          </div>

          {/* Capacity bar (mobile-friendly) */}
          <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-900/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Warehouse Utilisation</span>
              <span className="text-xs font-bold text-white">{warehouse.utilisation_pct}% of {(warehouse.capacity_units/1000).toFixed(0)}k units</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-700',
                  warehouse.utilisation_pct > 80 ? 'bg-red-500' : warehouse.utilisation_pct > 60 ? 'bg-amber-500' : 'bg-emerald-500',
                )}
                style={{ width: `${warehouse.utilisation_pct}%` }}
              />
            </div>
          </div>

          {/* Bulk inventory table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-5 py-3 text-left w-10" />
                  <th className="px-4 py-3 text-left"><span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">SKU Name</span></th>
                  <th className="px-4 py-3 text-left"><span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Bulk Stock</span></th>
                  <th className="px-4 py-3 text-left"><span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Status</span></th>
                  <th className="px-4 py-3 text-left"><span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Arrival Date</span></th>
                  <th className="px-4 py-3 text-left"><span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Velocity</span></th>
                  <th className="px-4 py-3 text-left"><span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {warehouse.inventory.map((item, idx) => (
                  <WarehouseRow
                    key={item.sku}
                    item={item}
                    index={idx}
                    onTransfer={ctx => setTransferCtx(ctx)}
                    sourceName={`${warehouse.store_name} Warehouse`}
                    sourceCityId={warehouse.city_id}
                    sourceCityName={cityObj.name}
                    destinations={warehouseDests}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend footer */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 border-t border-slate-800 bg-slate-900/30">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] text-slate-500">Critical (High velocity {'<'} 50 units)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[10px] text-slate-500">Overstock (Stagnant {'>'} 150 units)</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <Truck className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] text-slate-500">Transfer available for overstock items</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── THE SPOKES: Store Grid ────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section>

        {/* Spokes label */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Store className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              The Spokes · {cityStores.length} Stores
            </span>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-blue-500/20 to-transparent" />
          <span className="text-[11px] text-slate-500">Click a card to inspect inventory</span>
        </div>

        {/* Stores grid: 2 cols mobile → 4 cols desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cityStores.map(store => (
            <StoreCard
              key={store.id}
              store={store}
              cityName={cityObj.name}
              onClick={() => setSelectedStoreId(
                selectedStoreId === store.id ? null : store.id
              )}
            />
          ))}
        </div>

        {/* ── Store detail panel (opens below grid) ── */}
        {selectedStore && (
          <StoreDetailPanel
            store={selectedStore}
            cityName={cityObj.name}
            onClose={() => setSelectedStoreId(null)}
            onTransfer={ctx => setTransferCtx(ctx)}
            destinations={buildDestinations(selectedStore.name, selectedStore.city_id)}
          />
        )}
      </section>

      {/* ── Transfer Modal ───────────────────────────────────────────────── */}
      {transferCtx && (
        <TransferModal
          transferCtx={transferCtx}
          onClose={() => setTransferCtx(null)}
          onConfirm={handleTransferConfirm}
        />
      )}
    </div>
  )
}
