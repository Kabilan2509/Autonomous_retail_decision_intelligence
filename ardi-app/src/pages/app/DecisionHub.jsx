import React, { useState } from 'react'
import {
  ArrowRightLeft,
  Tag,
  PackagePlus,
  CheckCircle2,
  Pencil,
  XCircle,
  BrainCircuit,
  Sparkles,
  TrendingUp,
  Clock,
  ChevronRight,
  Zap,
  BarChart3,
  CloudSun,
  CalendarDays,
  ShoppingCart,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'
import { clsx } from 'clsx'
import useAppStore from '../../store/useStore'

// ─── Config Maps ─────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  INVENTORY_TRANSFER: {
    label: 'Inter-City Transfer',
    icon: ArrowRightLeft,
    badge: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
    glow: 'shadow-violet-500/10',
    accent: 'from-violet-500 to-purple-600',
    dot: 'bg-violet-400',
  },
  INTRA_CITY_TRANSFER: {
    label: 'Intra-City Transfer',
    icon: ArrowRightLeft,
    badge: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    glow: 'shadow-blue-500/10',
    accent: 'from-blue-500 to-cyan-600',
    dot: 'bg-blue-400',
  },
  WAREHOUSE_REPLENISHMENT: {
    label: 'Warehouse → Store',
    icon: PackagePlus,
    badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    glow: 'shadow-emerald-500/10',
    accent: 'from-emerald-500 to-teal-600',
    dot: 'bg-emerald-400',
  },
  MARKDOWN: {
    label: 'Markdown',
    icon: Tag,
    badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    glow: 'shadow-amber-500/10',
    accent: 'from-amber-500 to-yellow-600',
    dot: 'bg-amber-400',
  },
  RESTOCK_ALERT: {
    label: 'Restock Alert',
    icon: PackagePlus,
    badge: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    glow: 'shadow-rose-500/10',
    accent: 'from-rose-500 to-red-600',
    dot: 'bg-rose-400',
  },
}

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending',  cls: 'text-slate-400 bg-slate-800 border-slate-700' },
  APPROVED: { label: 'Approved', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  REJECTED: { label: 'Rejected', cls: 'text-red-400 bg-red-500/10 border-red-500/30' },
  MODIFIED: { label: 'Modified', cls: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
}

// Per-decision-type weighted reasoning factors
const WEIGHTED_FACTORS = {
  INVENTORY_TRANSFER: [
    { label: 'Weather Impact',       value: 40, color: 'bg-orange-400',  icon: CloudSun },
    { label: 'Demand Forecast',      value: 35, color: 'bg-blue-400',    icon: TrendingUp },
    { label: 'Stock Level Analysis', value: 25, color: 'bg-violet-400',  icon: BarChart3 },
  ],
  INTRA_CITY_TRANSFER: [
    { label: 'Weather Impact',       value: 38, color: 'bg-orange-400',  icon: CloudSun },
    { label: 'Stock Imbalance',      value: 37, color: 'bg-blue-400',    icon: BarChart3 },
    { label: 'Transfer Cost Saving', value: 25, color: 'bg-cyan-400',    icon: TrendingUp },
  ],
  WAREHOUSE_REPLENISHMENT: [
    { label: 'Stockout Risk',        value: 50, color: 'bg-red-400',     icon: AlertTriangle },
    { label: 'Sales Velocity',       value: 30, color: 'bg-emerald-400', icon: TrendingUp },
    { label: 'Warehouse Capacity',   value: 20, color: 'bg-blue-400',    icon: BarChart3 },
  ],
  MARKDOWN: [
    { label: 'Expiry Risk Score',  value: 45, color: 'bg-red-400',    icon: AlertTriangle },
    { label: 'Sales Velocity',     value: 30, color: 'bg-amber-400',  icon: TrendingUp },
    { label: 'Competitor Pricing', value: 25, color: 'bg-cyan-400',   icon: ShoppingCart },
  ],
  RESTOCK_ALERT: [
    { label: 'Event Forecast',  value: 50, color: 'bg-purple-400',  icon: CalendarDays },
    { label: 'Sales Velocity',  value: 30, color: 'bg-emerald-400', icon: TrendingUp },
    { label: 'Historical Data', value: 20, color: 'bg-blue-400',    icon: BarChart3 },
  ],
}

// ─── Circular Confidence SVG ──────────────────────────────────────────────────

function ConfidenceRing({ value }) {
  const r  = 36
  const cx = 48
  const cy = 48
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - value / 100)

  const color =
    value >= 90 ? '#34d399'   // emerald
    : value >= 75 ? '#60a5fa' // blue
    : '#fbbf24'               // amber

  return (
    <div className="relative flex items-center justify-center">
      <svg width="96" height="96" className="-rotate-90">
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="7"
        />
        {/* Progress */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white leading-none">{value}%</span>
        <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Confidence</span>
      </div>
    </div>
  )
}

// ─── Decision Type Badge ──────────────────────────────────────────────────────

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.INVENTORY_TRANSFER
  const Icon = cfg.icon
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.badge)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

// ─── Status Pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING
  return (
    <span className={clsx('px-2 py-0.5 rounded-full text-[11px] font-semibold border', cfg.cls)}>
      {cfg.label}
    </span>
  )
}

// ─── Action Card ──────────────────────────────────────────────────────────────

function ActionCard({ decision, isActive, onClick, onApprove, onReject, onModify }) {
  const cfg = TYPE_CONFIG[decision.type] ?? TYPE_CONFIG.INVENTORY_TRANSFER

  // Human-readable action headline
  const headline = (() => {
    if (decision.type === 'INVENTORY_TRANSFER')
      return `Transfer ${decision.quantity} units of ${decision.sku} · ${decision.source_label ?? decision.source} → ${decision.destination_label ?? decision.destination}`
    if (decision.type === 'INTRA_CITY_TRANSFER')
      return `Intra-city transfer of ${decision.quantity} units of ${decision.sku} · ${decision.source_label} → ${decision.destination_label}`
    if (decision.type === 'WAREHOUSE_REPLENISHMENT')
      return `Replenish ${decision.quantity} units of ${decision.sku} · ${decision.source_label} → ${decision.destination_label}`
    if (decision.type === 'MARKDOWN')
      return `Apply markdown on ${decision.quantity} units of ${decision.sku} at ${decision.source_label ?? decision.source}`
    if (decision.type === 'RESTOCK_ALERT')
      return `Restock ${decision.quantity} units of ${decision.sku} at ${decision.destination_label ?? decision.destination}`
    return decision.sku
  })()

  const isDone = decision.status === 'APPROVED' || decision.status === 'REJECTED'

  return (
    <div
      onClick={onClick}
      className={clsx(
        'glass-panel p-5 cursor-pointer transition-all duration-300 ease-in-out',
        'hover:bg-slate-800/80 hover:shadow-lg',
        isActive
          ? 'ring-2 ring-blue-500 border-blue-500/70 bg-slate-800/60 shadow-lg shadow-blue-500/10'
          : `shadow-lg ${cfg.glow}`,
        isDone && 'opacity-60',
      )}
    >
      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={decision.type} />
          <StatusPill status={decision.status} />
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
          <Clock className="w-3 h-3" />
          <span className="text-[11px]">
            {new Date(decision.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ── Decision ID ── */}
      <div className="flex items-center gap-2 mb-2">
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{decision.decision_id}</span>
      </div>

      {/* ── Headline ── */}
      <h3 className="text-[15px] font-semibold text-white leading-snug mb-2">{headline}</h3>

      {/* ── Rationale ── */}
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">{decision.rationale}</p>

      {/* ── Margin impact + confidence ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-0.5">Expected Impact</p>
          <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {decision.expected_margin_impact}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-0.5">AI Confidence</p>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${decision.confidence}%` }}
              />
            </div>
            <span className="text-xs font-bold text-white">{decision.confidence}%</span>
          </div>
        </div>
      </div>

      {/* ── SKU Pill ── */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
          <ShoppingCart className="w-3 h-3 text-slate-500" />
          SKU: {decision.sku}
          {decision.quantity && (
            <span className="ml-1 text-blue-400 font-semibold">× {decision.quantity}</span>
          )}
        </span>
      </div>

      {/* ── Action Buttons ── */}
      {!isDone ? (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Approve */}
          <button
            id={`btn-approve-${decision.decision_id}`}
            onClick={onApprove}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold',
              'bg-emerald-600 hover:bg-emerald-500 text-white',
              'transition-all duration-200 ease-in-out active:scale-95',
              'shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40',
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approve & Execute
          </button>

          {/* Modify */}
          <button
            id={`btn-modify-${decision.decision_id}`}
            onClick={onModify}
            className={clsx(
              'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium',
              'border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700/60',
              'transition-all duration-200 ease-in-out active:scale-95',
            )}
          >
            <Pencil className="w-3.5 h-3.5" />
            Modify
          </button>

          {/* Reject */}
          <button
            id={`btn-reject-${decision.decision_id}`}
            onClick={onReject}
            className={clsx(
              'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium',
              'bg-red-950/30 text-red-400 hover:bg-red-900/50 hover:text-red-300',
              'transition-all duration-200 ease-in-out active:scale-95',
            )}
          >
            <XCircle className="w-3.5 h-3.5" />
            Reject
          </button>
        </div>
      ) : (
        <div className={clsx(
          'flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold',
          decision.status === 'APPROVED'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20',
        )}>
          {decision.status === 'APPROVED'
            ? <><ThumbsUp className="w-3.5 h-3.5" /> Decision Approved & Queued</>
            : <><ThumbsDown className="w-3.5 h-3.5" /> Decision Rejected</>
          }
        </div>
      )}
    </div>
  )
}

// ─── Chain of Thought Sidebar ─────────────────────────────────────────────────

function ChainOfThought({ decision }) {
  if (!decision) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
          <BrainCircuit className="w-7 h-7 text-slate-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">No recommendation selected</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Select an AI recommendation<br/>to view reasoning.
          </p>
        </div>
        <div className="w-px h-8 bg-gradient-to-b from-slate-700 to-transparent" />
        <div className="flex items-center gap-1.5 text-slate-600 text-xs">
          <ChevronRight className="w-3.5 h-3.5" />
          Click any action card
        </div>
      </div>
    )
  }

  const factors = WEIGHTED_FACTORS[decision.type] ?? WEIGHTED_FACTORS.INVENTORY_TRANSFER
  const cfg = TYPE_CONFIG[decision.type] ?? TYPE_CONFIG.INVENTORY_TRANSFER

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">AI Reasoning</span>
        </div>
        <h3 className="text-sm font-bold text-white">{decision.decision_id}</h3>
        <p className="text-xs text-slate-500 mt-0.5 font-mono">{decision.type}</p>
      </div>

      {/* ── Confidence Ring ── */}
      <div className="flex flex-col items-center gap-3 py-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <ConfidenceRing value={decision.confidence} />
        <div className="text-center">
          <p className="text-xs font-semibold text-white">
            {decision.confidence >= 90 ? '🟢 High Confidence' : decision.confidence >= 75 ? '🔵 Moderate Confidence' : '🟡 Low Confidence'}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Based on 3 weighted signals</p>
        </div>
      </div>

      {/* ── Weighted Factors ── */}
      <div>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Weighted Factors
        </p>
        <div className="space-y-3.5">
          {factors.map((factor) => {
            const FactorIcon = factor.icon
            return (
              <div key={factor.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <FactorIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs text-slate-300 font-medium">{factor.label}</span>
                  </div>
                  <span className="text-xs font-bold text-white">{factor.value}%</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full transition-all duration-700 ease-out', factor.color)}
                    style={{ width: `${factor.value}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Decision metadata ── */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3.5 space-y-2.5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Signal Inputs</p>
        {decision.source && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Source Store</span>
            <span className="text-xs font-semibold text-white">{decision.source}</span>
          </div>
        )}
        {decision.destination && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Destination</span>
            <span className="text-xs font-semibold text-white">{decision.destination}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">SKU</span>
          <span className="text-xs font-semibold text-white">{decision.sku}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Quantity</span>
          <span className="text-xs font-semibold text-white">{decision.quantity} units</span>
        </div>
        <div className="pt-1 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Margin Impact</span>
          <span className="text-xs font-bold text-emerald-400">{decision.expected_margin_impact}</span>
        </div>
      </div>

      {/* ── Full rationale ── */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3.5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Full Rationale</p>
        <p className="text-xs text-slate-400 leading-relaxed">{decision.rationale}</p>
      </div>

      {/* ── Status ── */}
      <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
        <span className="text-xs text-slate-500">Current Status</span>
        <StatusPill status={decision.status} />
      </div>
    </div>
  )
}

// ─── Page Header Stats ────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="glass-panel px-4 py-3.5 flex items-center gap-3">
      <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', color)}>
        <Icon className="w-4.5 h-4.5 text-white" style={{ width: '1.1rem', height: '1.1rem' }} />
      </div>
      <div>
        <p className="text-lg font-bold text-white leading-none">{value}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ─── Main DecisionHub Page ────────────────────────────────────────────────────

export default function DecisionHub() {
  const ai_decisions         = useAppStore((s) => s.ai_decisions)
  const currentStore         = useAppStore((s) => s.currentStore)
  const activeCity           = useAppStore((s) => s.activeCity)
  const activeStore          = useAppStore((s) => s.activeStore)
  const cities               = useAppStore((s) => s.cities)
  const stores               = useAppStore((s) => s.stores)
  const updateDecisionStatus = useAppStore((s) => s.updateDecisionStatus)

  const [activeDecision, setActiveDecision] = useState(null)

  // ── Derive context labels ───────────────────────────────────────────────────
  const cityObj        = cities.find((c) => c.id === activeCity) ?? cities[0]
  const isAllStores    = activeStore === 'all'
  const storeObj       = isAllStores ? null : stores.find((s) => s.id === activeStore)

  // ── Filter decisions: city first, then narrow to store ─────────────────────
  const cityDecisions = ai_decisions.filter(
    (d) => d.source === cityObj.name || d.destination === cityObj.name,
  )
  const visibleDecisions = isAllStores
    ? cityDecisions
    : cityDecisions.filter(
        (d) =>
          d.source_store_id === activeStore ||
          d.destination_store_id === activeStore ||
          // also show city-wide decisions (null store_id) when a store is active
          (d.source_store_id === null && d.destination_store_id === null),
      )

  // Fallback: if city has no decisions show all
  const displayDecisions = visibleDecisions.length > 0 ? visibleDecisions : ai_decisions

  const pendingCount  = displayDecisions.filter((d) => d.status === 'PENDING').length
  const approvedCount = displayDecisions.filter((d) => d.status === 'APPROVED').length
  const totalImpact   = '+$7,480'

  // When a user clicks a card, toggle or switch active
  const handleCardClick = (decision) => {
    setActiveDecision((prev) =>
      prev?.decision_id === decision.decision_id ? null : decision
    )
  }

  const handleApprove = (decision) => {
    updateDecisionStatus(decision.decision_id, 'APPROVED')
    setActiveDecision((prev) =>
      prev?.decision_id === decision.decision_id
        ? { ...prev, status: 'APPROVED' }
        : prev
    )
  }

  const handleReject = (decision) => {
    updateDecisionStatus(decision.decision_id, 'REJECTED')
    setActiveDecision((prev) =>
      prev?.decision_id === decision.decision_id
        ? { ...prev, status: 'REJECTED' }
        : prev
    )
  }

  const handleModify = (decision) => {
    updateDecisionStatus(decision.decision_id, 'MODIFIED')
    setActiveDecision((prev) =>
      prev?.decision_id === decision.decision_id
        ? { ...prev, status: 'MODIFIED' }
        : prev
    )
  }

  return (
    <div className="min-h-full animate-fade-in">

      {/* ── Page heading ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Decision Hub</span>
        </div>
        <h1 className="text-2xl font-bold text-white">AI Action Center</h1>
        <p className="text-sm text-slate-400 mt-1">
          <span className="text-blue-400 font-semibold">{cityObj.name}</span>
          {!isAllStores && storeObj && (
            <> <span className="text-slate-600">›</span> <span className="text-purple-400 font-semibold">{storeObj.area}</span></>
          )}
          {isAllStores && <span className="text-slate-600"> · All Stores</span>}
          {' · '}{displayDecisions.length} AI recommendation{displayDecisions.length !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      {/* ── Summary stat strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={BrainCircuit}
          label="AI Recommendations"
          value={displayDecisions.length}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="Pending Review"
          value={pendingCount}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Margin Opportunity"
          value={totalImpact}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Left: Action Feed (col-span-2) ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Section label */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Action Feed</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-semibold">
                {ai_decisions.length} decisions
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AI engine active
            </div>
          </div>

          {/* Decision cards */}
          {displayDecisions.map((decision) => (
            <ActionCard
              key={decision.decision_id}
              decision={decision}
              isActive={activeDecision?.decision_id === decision.decision_id}
              onClick={() => handleCardClick(decision)}
              onApprove={(e) => { e.stopPropagation(); handleApprove(decision) }}
              onReject={(e)  => { e.stopPropagation(); handleReject(decision) }}
              onModify={(e)  => { e.stopPropagation(); handleModify(decision) }}
            />
          ))}
        </div>

        {/* ── Right: AI Chain of Thought (col-span-1) ── */}
        <div className="lg:col-span-1 lg:sticky lg:top-4">
          <div className="glass-panel p-5">
            {/* Sidebar header */}
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Chain of Thought</p>
                <p className="text-[10px] text-slate-500 mt-0.5">AI reasoning engine</p>
              </div>
            </div>

            <ChainOfThought
              decision={activeDecision}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
