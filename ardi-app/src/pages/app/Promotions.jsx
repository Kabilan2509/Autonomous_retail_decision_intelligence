import React, { useState } from 'react'
import {
  Tag,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sparkles,
  Zap,
  ShoppingCart,
  ArrowRight,
  ChevronRight,
  Star,
  Package,
  Percent,
  RefreshCw,
  XCircle,
  BarChart3,
  Target,
} from 'lucide-react'
import { clsx } from 'clsx'
import useAppStore from '../../store/useStore'

// ─── Clearance Radar Data ─────────────────────────────────────────────────────

const CLEARANCE_ITEMS = [
  {
    id: 'clr-1',
    sku: 'Festival Sweets',
    daysToExpiry: 12,
    stock: 500,
    currentPrice: 4.0,
    steps: [
      {
        label: 'Current Price',
        timing: 'Today',
        discount: 0,
        price: 4.0,
        color: 'text-slate-300',
        dotColor: 'bg-slate-500',
        lineColor: 'bg-slate-700',
        note: 'Base shelf price',
      },
      {
        label: "Today's AI Rec",
        timing: 'Immediately',
        discount: 15,
        price: 3.4,
        color: 'text-amber-400',
        dotColor: 'bg-amber-500',
        lineColor: 'bg-amber-500/40',
        note: 'Soft markdown to test elasticity',
      },
      {
        label: 'Clearance Push',
        timing: 'In 5 days',
        discount: 40,
        price: 2.4,
        color: 'text-red-400',
        dotColor: 'bg-red-500',
        lineColor: 'bg-red-500/40',
        note: 'Aggressive clearance · clears 500 units',
      },
    ],
  },
  {
    id: 'clr-2',
    sku: 'Dairy Products',
    daysToExpiry: 5,
    stock: 180,
    currentPrice: 3.5,
    steps: [
      {
        label: 'Current Price',
        timing: 'Today',
        discount: 0,
        price: 3.5,
        color: 'text-slate-300',
        dotColor: 'bg-slate-500',
        lineColor: 'bg-slate-700',
        note: 'Base shelf price',
      },
      {
        label: "Today's AI Rec",
        timing: 'Immediately',
        discount: 20,
        price: 2.8,
        color: 'text-amber-400',
        dotColor: 'bg-amber-500',
        lineColor: 'bg-amber-500/40',
        note: 'Urgent — 5 days to expiry',
      },
      {
        label: 'Final Clearance',
        timing: 'In 2 days',
        discount: 50,
        price: 1.75,
        color: 'text-red-400',
        dotColor: 'bg-red-500',
        lineColor: 'bg-red-500/40',
        note: 'Last chance · avoid write-off loss',
      },
    ],
  },
  {
    id: 'clr-3',
    sku: 'Cola 12-pk (Coimbatore Batch)',
    daysToExpiry: 13,
    stock: 210,
    currentPrice: 9.0,
    steps: [
      {
        label: 'Current Price',
        timing: 'Today',
        discount: 0,
        price: 9.0,
        color: 'text-slate-300',
        dotColor: 'bg-slate-500',
        lineColor: 'bg-slate-700',
        note: 'Base shelf price',
      },
      {
        label: "Today's AI Rec",
        timing: 'Immediately',
        discount: 10,
        price: 8.1,
        color: 'text-amber-400',
        dotColor: 'bg-amber-500',
        lineColor: 'bg-amber-500/40',
        note: 'Mild markdown — batch aged 33 days',
      },
      {
        label: 'Markdown Flush',
        timing: 'In 7 days',
        discount: 20,
        price: 7.2,
        color: 'text-orange-400',
        dotColor: 'bg-orange-500',
        lineColor: 'bg-orange-500/40',
        note: 'Recover $840 vs. full write-off',
      },
    ],
  },
]

// ─── Competitor Intel Data ────────────────────────────────────────────────────

const COMPETITOR_ROWS = [
  {
    sku: 'SPF50 Sunscreen',
    ourPrice: 12.0,
    compPrice: 11.5,
    status: 'price_match',
    statusLabel: 'Price Match Rec.',
    trend: 'down',
  },
  {
    sku: 'Cola 12-pk',
    ourPrice: 9.0,
    compPrice: null,
    status: 'opportunity',
    statusLabel: 'Competitor OOS',
    trend: 'up',
  },
  {
    sku: 'Festival Sweets',
    ourPrice: 4.0,
    compPrice: 4.5,
    status: 'winning',
    statusLabel: 'We\'re Cheaper',
    trend: 'up',
  },
]

const STATUS_STYLES = {
  price_match: {
    cls: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  },
  opportunity: {
    cls: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  },
  winning: {
    cls: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  },
}

// ─── Expiry Urgency Badge ─────────────────────────────────────────────────────

function ExpiryBadge({ days }) {
  const urgent = days <= 5
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold',
        urgent
          ? 'bg-red-500/15 text-red-300 border border-red-500/30'
          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      )}
    >
      <Clock className="w-2.5 h-2.5" />
      {days}d to expiry
    </span>
  )
}

// ─── Clearance Item Card ──────────────────────────────────────────────────────

function ClearanceCard({ item }) {
  const [applied, setApplied] = useState(false)
  const [applying, setApplying] = useState(false)

  const handleApply = () => {
    setApplying(true)
    setTimeout(() => {
      setApplying(false)
      setApplied(true)
    }, 900)
  }

  const urgency = item.daysToExpiry <= 5 ? 'critical' : 'warning'

  return (
    <div
      className={clsx(
        'rounded-xl p-5 transition-all duration-300',
        applied && 'ring-1 ring-purple-500/40',
      )}
      style={{
        background: 'rgba(15,23,42,0.7)',
        border: applied
          ? '1px solid rgba(168,85,247,0.4)'
          : urgency === 'critical'
          ? '1px solid rgba(239,68,68,0.25)'
          : '1px solid rgba(51,65,85,0.6)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">{item.sku}</p>
            <div className="flex items-center gap-2 mt-1">
              <ExpiryBadge days={item.daysToExpiry} />
              <span className="text-[10px] text-slate-500">{item.stock.toLocaleString()} units</span>
            </div>
          </div>
        </div>

        {/* Apply button */}
        {applied ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold
                            bg-purple-500/15 text-purple-300 border border-purple-500/30 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Applied
          </span>
        ) : (
          <button
            id={`btn-apply-promo-${item.id}`}
            onClick={handleApply}
            disabled={applying}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0',
              'bg-purple-600 hover:bg-purple-500 text-white',
              'transition-all duration-200 active:scale-95',
              'shadow-md shadow-purple-500/20 hover:shadow-purple-500/35',
              applying && 'opacity-70 cursor-wait',
            )}
          >
            {applying ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Zap className="w-3 h-3" />
            )}
            {applying ? 'Applying…' : 'Apply AI Promotion'}
          </button>
        )}
      </div>

      {/* AI Pricing Timeline */}
      <div className="space-y-0">
        {item.steps.map((step, idx) => (
          <div key={idx} className="flex gap-3">
            {/* Left: dot + line */}
            <div className="flex flex-col items-center" style={{ width: 24 }}>
              <div className={clsx('w-3 h-3 rounded-full border-2 border-slate-900 shrink-0 mt-1', step.dotColor)} />
              {idx < item.steps.length - 1 && (
                <div className={clsx('w-0.5 flex-1 mt-1', step.lineColor)} style={{ minHeight: 28 }} />
              )}
            </div>

            {/* Right: content */}
            <div className={clsx('flex-1 pb-4', idx === item.steps.length - 1 && 'pb-0')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={clsx('text-xs font-bold', step.color)}>{step.label}</span>
                  <span className="text-[10px] text-slate-600 font-mono">{step.timing}</span>
                </div>
                <div className="flex items-center gap-2 text-right">
                  {step.discount > 0 && (
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-md border border-red-500/20">
                      −{step.discount}%
                    </span>
                  )}
                  <span className={clsx('text-sm font-bold font-mono', step.color)}>
                    ${step.price.toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 mt-0.5">{step.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Savings projection */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">Projected recovery vs. write-off</span>
        <span className="text-xs font-bold text-emerald-400">
          +${(item.stock * item.steps[item.steps.length - 1].price).toFixed(0)} recovered
        </span>
      </div>
    </div>
  )
}

// ─── AI Margin Alert Banner ───────────────────────────────────────────────────

function MarginAlertBanner() {
  const [reverted, setReverted] = useState(false)

  return (
    <div
      className={clsx(
        'p-4 rounded-xl flex items-start gap-4 transition-all duration-300',
        reverted
          ? 'bg-blue-900/20 border border-blue-500/40'
          : 'bg-emerald-900/30 border border-emerald-500/50',
      )}
    >
      {/* Icon */}
      <div
        className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          reverted
            ? 'bg-blue-500/20 border border-blue-500/30'
            : 'bg-emerald-500/20 border border-emerald-500/30',
        )}
      >
        {reverted
          ? <CheckCircle2 className="w-4.5 h-4.5 text-blue-400" style={{ width: '1.05rem', height: '1.05rem' }} />
          : <TrendingUp className="w-4.5 h-4.5 text-emerald-400" style={{ width: '1.05rem', height: '1.05rem' }} />
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={clsx(
              'text-[10px] font-bold uppercase tracking-widest',
              reverted ? 'text-blue-400' : 'text-emerald-400',
            )}
          >
            {reverted ? 'Action Taken' : 'Market Opportunity'}
          </span>
          <span
            className={clsx(
              'w-1.5 h-1.5 rounded-full',
              reverted ? 'bg-blue-400' : 'bg-emerald-400 animate-pulse',
            )}
          />
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {reverted ? (
            <>'Cola 12-pk' discount has been <span className="font-bold text-blue-300">reverted to full price</span>. Margin maximized while competitor remains OOS.</>
          ) : (
            <><span className="font-bold text-white">'Nearby MegaMart'</span> is currently{' '}
            <span className="text-red-400 font-bold">OUT OF STOCK</span> of{' '}
            <span className="font-semibold text-white">Cola 12-pk</span>. AI recommends{' '}
            <span className="text-emerald-300 font-semibold">canceling current 10% discount</span>{' '}
            to maximize margins during competitor downtime.</>
          )}
        </p>
      </div>

      {/* CTA */}
      {!reverted ? (
        <button
          id="btn-revert-full-price"
          onClick={() => setReverted(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold shrink-0
                      bg-emerald-600 hover:bg-emerald-500 text-white
                      transition-all duration-200 active:scale-95
                      shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Revert to Full Price
        </button>
      ) : (
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0
                          bg-blue-500/15 text-blue-300 border border-blue-500/30">
          <CheckCircle2 className="w-3 h-3" />
          Done
        </span>
      )}
    </div>
  )
}

// ─── Competitor Table ─────────────────────────────────────────────────────────

function CompetitorTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-800" style={{ background: 'rgba(15,23,42,0.6)' }}>
            {['SKU', 'Our Price', 'MegaMart', 'Status'].map((h) => (
              <th key={h} className="px-4 py-3 text-left">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{h}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPETITOR_ROWS.map((row, idx) => {
            const statusStyle = STATUS_STYLES[row.status]
            const priceDiff = row.compPrice != null
              ? (row.ourPrice - row.compPrice).toFixed(2)
              : null

            return (
              <tr
                key={row.sku}
                className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors duration-150 group"
              >
                {/* SKU */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <span className="text-xs font-semibold text-white">{row.sku}</span>
                  </div>
                </td>

                {/* Our Price */}
                <td className="px-4 py-3.5">
                  <span className="text-sm font-bold text-white font-mono">${row.ourPrice.toFixed(2)}</span>
                </td>

                {/* Competitor Price */}
                <td className="px-4 py-3.5">
                  {row.compPrice != null ? (
                    <div>
                      <span className="text-sm font-bold font-mono text-slate-300">${row.compPrice.toFixed(2)}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {parseFloat(priceDiff) > 0 ? (
                          <>
                            <TrendingUp className="w-2.5 h-2.5 text-red-400" />
                            <span className="text-[9px] text-red-400 font-semibold">We're +${priceDiff} higher</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-2.5 h-2.5 text-emerald-400" />
                            <span className="text-[9px] text-emerald-400 font-semibold">We're ${Math.abs(priceDiff)} cheaper</span>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md
                                      bg-red-500/15 text-red-300 border border-red-500/25">
                      <XCircle className="w-3 h-3" />
                      Out of Stock
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3.5">
                  <span className={clsx('px-2.5 py-1 rounded-full text-[10px] font-bold', statusStyle.cls)}>
                    {row.statusLabel}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="glass-panel px-4 py-3.5 flex items-center gap-3">
      <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon className="w-4.5 h-4.5 text-white" style={{ width: '1.1rem', height: '1.1rem' }} />
      </div>
      <div>
        <p className="text-lg font-bold text-white leading-none">{value}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-emerald-400 mt-0.5 font-semibold">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Main Promotions Page ─────────────────────────────────────────────────────

export default function Promotions() {
  const currentStore = useAppStore((s) => s.currentStore)

  return (
    <div className="min-h-full animate-fade-in">

      {/* ── Page heading ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Tag className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">
            Promotions & Competitor Intel
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Clearance Radar</h1>
        <p className="text-sm text-slate-400 mt-1">
          AI-driven dynamic pricing · Active store:{' '}
          <span className="text-purple-400 font-semibold">{currentStore}</span>
        </p>
      </div>

      {/* ── Summary stat strip ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatPill
          icon={Tag}
          label="Items Near Expiry"
          value={CLEARANCE_ITEMS.length}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          sub="Action required"
        />
        <StatPill
          icon={Percent}
          label="Avg. Recommended Discount"
          value="22%"
          color="bg-gradient-to-br from-purple-500 to-indigo-600"
        />
        <StatPill
          icon={Target}
          label="Competitors Monitored"
          value="3"
          color="bg-gradient-to-br from-blue-500 to-cyan-600"
        />
        <StatPill
          icon={TrendingUp}
          label="Margin Opportunity"
          value="+$1,890"
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
          sub="If all actions taken"
        />
      </div>

      {/* ── Main two-column grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ══ LEFT: Clearance Radar ══════════════════════════════════════ */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-xl space-y-5">

          {/* Section header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Clearance Radar</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Expiry-driven AI pricing schedule</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {CLEARANCE_ITEMS.length} items flagged
            </div>
          </div>

          {/* AI Legend */}
          <div className="flex items-center gap-4 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span className="text-[10px] text-slate-500">Current</span>
            </div>
            <ChevronRight className="w-3 h-3 text-slate-700" />
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-[10px] text-amber-400">AI Rec (immediate)</span>
            </div>
            <ChevronRight className="w-3 h-3 text-slate-700" />
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-[10px] text-red-400">Clearance push</span>
            </div>
          </div>

          {/* Clearance item cards */}
          <div className="space-y-4">
            {CLEARANCE_ITEMS.map((item) => (
              <ClearanceCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* ══ RIGHT: Competitor Intel ════════════════════════════════════ */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-xl space-y-5">

          {/* Section header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Competitor Intel</p>
                <p className="text-[10px] text-slate-500 mt-0.5">vs. Nearby MegaMart · Live scan</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Monitoring
            </div>
          </div>

          {/* ── AI Margin Alert Banner ── */}
          <MarginAlertBanner />

          {/* ── Competitor comparison table ── */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
              Price Comparison Matrix
            </p>
            <CompetitorTable />
          </div>

          {/* ── Market insights strip ── */}
          <div className="space-y-2.5 pt-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              AI Market Insights
            </p>
            {[
              {
                icon: Star,
                text: "SPF50 Sunscreen: 3.4× demand spike vs. last week — recommend holding price.",
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
              },
              {
                icon: Sparkles,
                text: "Festival Sweets: Karthigai Deepam in 15 days — keep at full price until Day 10.",
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
              },
              {
                icon: AlertTriangle,
                text: "MegaMart stocking cycle usually 48–72h. Monitor Cola 12-pk restock.",
                color: 'text-red-400',
                bg: 'bg-red-500/10',
              },
            ].map((insight, i) => {
              const InsightIcon = insight.icon
              return (
                <div
                  key={i}
                  className={clsx(
                    'flex items-start gap-2.5 px-3 py-2.5 rounded-lg',
                    insight.bg,
                    'border border-slate-700/40',
                  )}
                >
                  <InsightIcon className={clsx('w-3.5 h-3.5 shrink-0 mt-0.5', insight.color)} />
                  <p className="text-xs text-slate-400 leading-relaxed">{insight.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
