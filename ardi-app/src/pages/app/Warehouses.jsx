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
} from 'lucide-react'
import { clsx } from 'clsx'
import useAppStore from '../../store/useStore'

// ─── Mock ETA Distance Matrix ─────────────────────────────────────────────────

const ETA_MAP = {
  'Chennai-Coimbatore':  { time: '6h 30m',  km: '495 km', mode: 'Road' },
  'Chennai-Palani':      { time: '5h 15m',  km: '400 km', mode: 'Road' },
  'Coimbatore-Chennai':  { time: '6h 30m',  km: '495 km', mode: 'Road' },
  'Coimbatore-Palani':   { time: '1h 45m',  km: '100 km', mode: 'Road' },
  'Palani-Chennai':      { time: '5h 15m',  km: '400 km', mode: 'Road' },
  'Palani-Coimbatore':   { time: '1h 45m',  km: '100 km', mode: 'Road' },
}

function getEta(from, to) {
  if (!from || !to) return null
  const key = `${from}-${to}`
  return ETA_MAP[key] ?? { time: '~4h 00m', km: 'N/A', mode: 'Road' }
}

// ─── Sales Velocity Icon ──────────────────────────────────────────────────────

function VelocityIcon({ velocity }) {
  if (velocity === 'High')
    return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
  if (velocity === 'Stagnant')
    return <TrendingDown className="w-3.5 h-3.5 text-red-400" />
  if (velocity === 'Low')
    return <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
  return <Minus className="w-3.5 h-3.5 text-slate-500" />
}

function VelocityColor(velocity) {
  if (velocity === 'High')     return 'text-emerald-400'
  if (velocity === 'Stagnant') return 'text-red-400'
  if (velocity === 'Low')      return 'text-amber-400'
  return 'text-slate-400'
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StockStatusBadge({ item }) {
  const isCritical = item.sales_velocity === 'High' && item.stock_level < 50
  const isOverstock = item.sales_velocity === 'Stagnant' && item.stock_level > 150

  if (isCritical) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold
                        bg-red-500/15 text-red-300 border border-red-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
        Critical: Trending
      </span>
    )
  }

  if (isOverstock) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold
                        bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
        Overstock
      </span>
    )
  }

  if (item.stock_level < 100) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold
                        bg-slate-800 text-slate-400 border border-slate-700">
        Normal
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold
                      bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
      Healthy
    </span>
  )
}

// ─── Transfer Modal ───────────────────────────────────────────────────────────

function TransferModal({ item, currentStore, stores, onClose, onConfirm }) {
  const otherStores = stores.filter((s) => s.name !== currentStore)
  const [destStore, setDestStore]   = useState(otherStores[0]?.name ?? '')
  const [quantity, setQuantity]     = useState(Math.min(100, item.stock_level))
  const [confirmed, setConfirmed]   = useState(false)

  const eta = getEta(currentStore, destStore)

  const handleConfirm = () => {
    setConfirmed(true)
    setTimeout(() => {
      onConfirm({ sku: item.sku, quantity, from: currentStore, to: destStore })
    }, 1200)
  }

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Modal card */}
      <div
        className="relative w-full max-w-md mx-4 glass-panel shadow-2xl shadow-black/60
                    border border-slate-700/80 animate-fade-in"
        style={{ background: 'rgba(15,23,42,0.92)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient top accent */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 rounded-t-xl" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600
                             flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Truck className="w-4.5 h-4.5 text-white" style={{ width: '1.1rem', height: '1.1rem' }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Transfer Stock</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Manual inventory redistribution</p>
            </div>
          </div>
          <button
            id="btn-transfer-modal-close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800
                        transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* SKU display */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Selected SKU
            </p>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700">
              <Package className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-sm font-semibold text-white">{item.sku}</span>
              <span className="ml-auto text-xs text-slate-500 font-mono">{item.stock_level} units available</span>
            </div>
          </div>

          {/* Source → Destination row */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Transfer Route
            </p>
            <div className="flex items-center gap-2">
              {/* From */}
              <div className="flex-1 px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-center">
                <p className="text-[10px] text-slate-500 mb-0.5">From</p>
                <p className="text-sm font-bold text-white">{currentStore}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
              {/* To */}
              <div className="flex-1">
                <select
                  id="select-destination-store"
                  value={destStore}
                  onChange={(e) => setDestStore(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700
                              text-white text-sm font-bold text-center
                              focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/60
                              transition-all duration-200 cursor-pointer appearance-none"
                  style={{ textAlignLast: 'center' }}
                >
                  {otherStores.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ETA chip */}
          {eta && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl
                             bg-gradient-to-r from-blue-500/10 to-purple-500/10
                             border border-blue-500/20">
              <Clock className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Estimated Transit
                </p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {currentStore} → {destStore}
                  <span className="mx-2 text-slate-600">·</span>
                  <span className="text-blue-300">{eta.time}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500">{eta.mode}</p>
                <p className="text-xs font-semibold text-slate-400">{eta.km}</p>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                Transfer Quantity
              </p>
              <span className="text-[11px] text-slate-500">Max: {item.stock_level}</span>
            </div>
            <input
              id="input-transfer-quantity"
              type="number"
              min={1}
              max={item.stock_level}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(item.stock_level, Number(e.target.value))))}
              className="input-field text-center text-lg font-bold"
            />
            {/* Quantity slider */}
            <input
              type="range"
              min={1}
              max={item.stock_level}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full mt-2 accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
              <span>1</span>
              <span>{Math.round(item.stock_level / 2)}</span>
              <span>{item.stock_level}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <button
            id="btn-transfer-cancel"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold
                        border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800
                        transition-all duration-200 active:scale-95"
          >
            Cancel
          </button>
          <button
            id="btn-transfer-confirm"
            onClick={handleConfirm}
            disabled={confirmed || quantity < 1}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold',
              'transition-all duration-200 active:scale-95',
              confirmed
                ? 'bg-emerald-600/80 text-white border border-emerald-500/40'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25'
            )}
          >
            {confirmed ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Transfer Queued!
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                Confirm Transfer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Summary Stat Card ────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, sub }) {
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

// ─── Inventory Table Row ──────────────────────────────────────────────────────

function InventoryRow({ item, index, onTransfer }) {
  const isOverstock = item.sales_velocity === 'Stagnant' && item.stock_level > 150

  const formattedDate = new Date(item.date_arrived).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  const stockBarColor =
    item.stock_level < 50  ? 'bg-red-500'
    : item.stock_level < 150 ? 'bg-amber-500'
    : 'bg-emerald-500'

  const stockBarPct = Math.min(100, (item.stock_level / 650) * 100)

  return (
    <tr
      className="group border-b border-slate-800/60 hover:bg-slate-800/50 transition-colors duration-150"
    >
      {/* Index */}
      <td className="px-5 py-4 w-10">
        <span className="text-[11px] font-mono text-slate-600">{String(index + 1).padStart(2, '0')}</span>
      </td>

      {/* SKU Name */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-sm font-semibold text-white">{item.sku}</span>
        </div>
      </td>

      {/* Current Stock */}
      <td className="px-4 py-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-bold text-white">{item.stock_level.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500">units</span>
          </div>
          <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all duration-700', stockBarColor)}
              style={{ width: `${stockBarPct}%` }}
            />
          </div>
        </div>
      </td>

      {/* Status Badge */}
      <td className="px-4 py-4">
        <StockStatusBadge item={item} />
      </td>

      {/* Arrival Date */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="text-xs text-slate-400">{formattedDate}</span>
        </div>
      </td>

      {/* Sales Velocity */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-1.5">
          <VelocityIcon velocity={item.sales_velocity} />
          <span className={clsx('text-xs font-semibold', VelocityColor(item.sales_velocity))}>
            {item.sales_velocity}
          </span>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        {isOverstock ? (
          <button
            id={`btn-transfer-${item.sku.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={() => onTransfer(item)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold
                        bg-amber-500/15 text-amber-300 border border-amber-500/30
                        hover:bg-amber-500/25 hover:border-amber-400/50
                        transition-all duration-200 active:scale-95"
          >
            <Truck className="w-3.5 h-3.5" />
            Transfer Stock
          </button>
        ) : (
          <span className="text-[11px] text-slate-700 px-3 py-1.5">—</span>
        )}
      </td>
    </tr>
  )
}

// ─── Main Warehouses Page ─────────────────────────────────────────────────────

export default function Warehouses() {
  const currentStore        = useAppStore((s) => s.currentStore)
  const stores              = useAppStore((s) => s.stores)
  const warehouses          = useAppStore((s) => s.warehouses)
  const getCurrentWarehouse = useAppStore((s) => s.getCurrentWarehouse)

  const warehouse = getCurrentWarehouse()
  const inventory = warehouse?.inventory ?? []

  const [modalItem, setModalItem]   = useState(null)
  const [transfers, setTransfers]   = useState([])   // log of confirmed transfers

  // Derived stats
  const totalStock    = useMemo(() => inventory.reduce((sum, i) => sum + i.stock_level, 0), [inventory])
  const criticalCount = useMemo(() => inventory.filter((i) => i.sales_velocity === 'High' && i.stock_level < 50).length, [inventory])
  const overstockCount= useMemo(() => inventory.filter((i) => i.sales_velocity === 'Stagnant' && i.stock_level > 150).length, [inventory])

  const handleTransferConfirm = (transfer) => {
    setTransfers((prev) => [transfer, ...prev])
    setModalItem(null)
  }

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
        <h1 className="text-2xl font-bold text-white">Inventory Control</h1>
        <p className="text-sm text-slate-400 mt-1">
          Viewing inventory for{' '}
          <span className="text-purple-400 font-semibold">{warehouse?.location ?? currentStore}</span>
          {' · '}
          <span className="text-blue-400 font-semibold">{currentStore}</span>
        </p>
      </div>

      {/* ── Summary stat strip ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Package}
          label="Total Stock Units"
          value={totalStock.toLocaleString()}
          color="bg-gradient-to-br from-purple-500 to-indigo-600"
        />
        <StatCard
          icon={BarChart3}
          label="SKUs Tracked"
          value={inventory.length}
          color="bg-gradient-to-br from-blue-500 to-cyan-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="Critical (Trending)"
          value={criticalCount}
          sub={criticalCount > 0 ? 'Immediate action needed' : 'All clear'}
          color="bg-gradient-to-br from-red-500 to-rose-600"
        />
        <StatCard
          icon={Activity}
          label="Overstock Items"
          value={overstockCount}
          sub={overstockCount > 0 ? 'Transfer recommended' : 'Balanced'}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>

      {/* ── Transfer log toast ───────────────────────────────────────────── */}
      {transfers.length > 0 && (
        <div className="mb-4 space-y-2">
          {transfers.slice(0, 3).map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-xl
                          bg-emerald-500/10 border border-emerald-500/20 animate-fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300">
                <span className="font-bold">{t.quantity} units</span> of{' '}
                <span className="font-bold">{t.sku}</span> queued for transfer from{' '}
                <span className="font-bold">{t.from}</span> →{' '}
                <span className="font-bold">{t.to}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Inventory table ──────────────────────────────────────────────── */}
      <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden">

        {/* Table header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Inventory</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-semibold">
              {inventory.length} SKUs
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live tracking
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-5 py-3 text-left w-10" />
                <th className="px-4 py-3 text-left">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">SKU Name</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Current Stock</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Status</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Arrival Date</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Sales Velocity</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, idx) => (
                <InventoryRow
                  key={item.sku}
                  item={item}
                  index={idx}
                  onTransfer={setModalItem}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {inventory.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Package className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500">No inventory data for {currentStore}</p>
          </div>
        )}

        {/* Legend footer */}
        <div className="flex items-center gap-6 px-5 py-3.5 border-t border-slate-800 bg-slate-900/30">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] text-slate-500">Critical: Trending (High velocity + Stock &lt; 50)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[10px] text-slate-500">Overstock (Stagnant velocity + Stock &gt; 150)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Truck className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-slate-500">Transfer available for overstock items</span>
          </div>
        </div>
      </div>

      {/* ── Warehouse Info card ──────────────────────────────────────────── */}
      <div className="mt-6 glass-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Warehouse Details</span>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Warehouse ID</p>
            <p className="text-sm font-bold text-white font-mono">{warehouse?.warehouse_id}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Linked Store</p>
            <p className="text-sm font-bold text-white">{warehouse?.store_name}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Location</p>
            <p className="text-sm font-semibold text-slate-300">{warehouse?.location}</p>
          </div>
        </div>
      </div>

      {/* ── Transfer Modal ───────────────────────────────────────────────── */}
      {modalItem && (
        <TransferModal
          item={modalItem}
          currentStore={currentStore}
          stores={stores}
          onClose={() => setModalItem(null)}
          onConfirm={handleTransferConfirm}
        />
      )}
    </div>
  )
}
