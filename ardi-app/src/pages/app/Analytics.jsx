import React, { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  LabelList,
} from 'recharts'
import {
  BarChart3,
  CloudLightning,
  PartyPopper,
  Sun,
  TrendingUp,
  Sparkles,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  Zap,
  Activity,
  Flame,
  Store,
  Trophy,
  Layers,
} from 'lucide-react'
import { clsx } from 'clsx'
import useAppStore from '../../store/useStore'

// ─── Date labels (shared) ─────────────────────────────────────────────────────
const DATE_LABELS = [
  'Oct 11', 'Oct 12', 'Oct 13', 'Oct 14', 'Oct 15', 'Oct 16',
  'Oct 17', 'Oct 18', 'Oct 19', 'Oct 20', 'Oct 21', 'Oct 22', 'Oct 23',
]
const BRIDGE_IDX = 6 // Oct 17 is the forecast boundary

// Historical multipliers per day (relative to daily_revenue / 300)
const HIST_MULT = [0.88, 0.96, 0.91, 1.08, 1.18, 1.30, 1.42]
// Predicted multipliers per day — event spikes on Oct 18 (diwali), Oct 20 (monsoon), Oct 22 (heatwave)
const PRED_MULT = [null, null, null, null, null, null, 1.42, 2.28, 2.75, 4.12, 3.60, 3.09, 2.65]

// Build chart data for a single store given its daily_revenue
function buildStoreChartData(daily_revenue) {
  const base = Math.round(daily_revenue / 300)
  return DATE_LABELS.map((date, i) => {
    const isHist = i <= BRIDGE_IDX
    const isPred = i >= BRIDGE_IDX
    return {
      date,
      historical: isHist ? Math.round(base * HIST_MULT[i]) : null,
      predicted:  isPred && PRED_MULT[i] != null ? Math.round(base * PRED_MULT[i]) : null,
      event: i === 7 ? 'diwali' : i === 9 ? 'monsoon' : i === 11 ? 'heatwave' : null,
    }
  })
}

// Aggregate chart data across all stores in a city
function buildAggregatedChartData(cityStores) {
  return DATE_LABELS.map((date, i) => {
    const isHist = i <= BRIDGE_IDX
    const isPred = i >= BRIDGE_IDX
    const totalBase = cityStores.reduce((sum, s) => sum + Math.round(s.daily_revenue / 300), 0)
    return {
      date,
      historical: isHist ? Math.round(totalBase * HIST_MULT[i]) : null,
      predicted:  isPred && PRED_MULT[i] != null ? Math.round(totalBase * PRED_MULT[i]) : null,
      event: i === 7 ? 'diwali' : i === 9 ? 'monsoon' : i === 11 ? 'heatwave' : null,
    }
  })
}

// ─── Per-SKU Demand Breakdown (static for the demo) ───────────────────────────
const SKU_DEMAND = [
  { sku: 'Umbrellas',       predicted: 560, change: '+300%', color: '#3b82f6', event: 'Monsoon Onset'   },
  { sku: 'Festival Sweets', predicted: 420, change: '+195%', color: '#a855f7', event: 'Diwali Festival'  },
  { sku: 'SPF50 Sunscreen', predicted: 380, change: '+210%', color: '#f59e0b', event: 'Heatwave Alert'   },
  { sku: 'Cola 12-pk',      predicted: 310, change: '+85%',  color: '#10b981', event: 'Heatwave Alert'   },
]

// ─── Upcoming Events ──────────────────────────────────────────────────────────
const EVENTS = [
  {
    id: 'diwali',
    date: 'Oct 18',
    label: 'Diwali Festival',
    sub: 'High Sweets Demand',
    detail: 'Historical 11x demand surge for Festival Sweets. AI pre-approved restock of 500 units.',
    icon: PartyPopper,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.10)',
    border: 'rgba(168,85,247,0.30)',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    refColor: '#a855f7',
    impact: '+195% demand',
  },
  {
    id: 'monsoon',
    date: 'Oct 20',
    label: 'Monsoon Onset',
    sub: 'High Umbrella Demand',
    detail: 'IMD forecast: heavy rainfall across Palani region. Umbrella demand expected to spike 300%. Inventory transfer from Coimbatore already approved.',
    icon: CloudLightning,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.30)',
    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    refColor: '#3b82f6',
    impact: '+300% demand',
  },
  {
    id: 'heatwave',
    date: 'Oct 22',
    label: 'Heatwave Alert',
    sub: 'High Beverage Demand',
    detail: 'IMD red alert: Chennai 38 deg C sustained over 4 days. SPF50 Sunscreen and Cola 12-pk demand to surge. Pricing held at full to maximize margin.',
    icon: Sun,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.30)',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    refColor: '#f59e0b',
    impact: '+210% demand',
  },
]

// ─── City theme colours ───────────────────────────────────────────────────────
const CITY_THEME = {
  chennai:    { accent: '#3b82f6', label: 'blue'    },
  bangalore:  { accent: '#10b981', label: 'emerald' },
  coimbatore: { accent: '#f59e0b', label: 'amber'   },
}

// Bar chart colours for Top Stores ranking (rank 1-3 gold/silver/bronze, rest slate)
const RANK_COLORS = ['#f59e0b', '#94a3b8', '#cd7c30']

// ─── Custom Dark Tooltip ──────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, isAggregated }) {
  if (!active || !payload?.length) return null
  const hist = payload.find((p) => p.dataKey === 'historical')
  const pred = payload.find((p) => p.dataKey === 'predicted')
  const event = EVENTS.find((e) => e.date === label)

  return (
    <div
      style={{
        background: 'rgba(2,6,23,0.96)',
        border: '1px solid rgba(51,65,85,0.8)',
        borderRadius: 10,
        padding: '10px 14px',
        minWidth: 185,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </p>
      {isAggregated && (
        <p style={{ fontSize: 9, color: '#475569', marginBottom: 6 }}>All stores combined</p>
      )}
      {hist?.value != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Historical</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginLeft: 'auto' }}>{hist.value}</span>
        </div>
      )}
      {pred?.value != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: event ? 8 : 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7' }} />
          <span style={{ fontSize: 11, color: '#94a3b8' }}>AI Predicted</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', marginLeft: 'auto' }}>{pred.value}</span>
        </div>
      )}
      {event && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(51,65,85,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: event.color, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: event.color, fontWeight: 600 }}>{event.label}</span>
        </div>
      )}
    </div>
  )
}

// ─── Bar Chart Tooltip (Top Stores) ──────────────────────────────────────────
function StoreBarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{
      background: 'rgba(2,6,23,0.96)',
      border: '1px solid rgba(51,65,85,0.8)',
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc', marginBottom: 2 }}>{d.payload.name}</p>
      <p style={{ fontSize: 10, color: '#94a3b8' }}>{d.payload.area}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color: d.fill, marginTop: 4 }}>
        {'\u20B9'}{d.value.toLocaleString()}/day
      </p>
    </div>
  )
}

// ─── AI Insight Sidebar ───────────────────────────────────────────────────────
function AiInsightBox({ activeEvent }) {
  const ev = activeEvent ?? EVENTS[1]

  return (
    <div
      className="rounded-xl p-4 h-full flex flex-col gap-4 transition-all duration-300"
      style={{
        background: 'rgba(15,23,42,0.85)',
        border: `1px solid ${ev.border}`,
        boxShadow: `0 0 24px ${ev.bg}`,
      }}
    >
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: ev.bg, border: `1px solid ${ev.border}` }}>
          <BrainCircuit className="w-4 h-4" style={{ color: ev.color }} />
        </div>
        <div>
          <p className="text-xs font-bold text-white leading-none">AI Insight</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Event-driven forecast</p>
        </div>
        <span className="ml-auto w-2 h-2 rounded-full animate-pulse" style={{ background: ev.color }} />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: ev.bg, border: `1px solid ${ev.border}` }}>
        <ev.icon className="w-3.5 h-3.5 shrink-0" style={{ color: ev.color }} />
        <span className="text-xs font-bold" style={{ color: ev.color }}>{ev.label}</span>
        <span className="text-[10px] text-slate-500 ml-auto">{ev.date}</span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed flex-1">{ev.detail}</p>

      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
        style={{ background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(51,65,85,0.5)' }}>
        <span className="text-[10px] text-slate-500">AI Demand Impact</span>
        <span className="text-sm font-bold" style={{ color: ev.color }}>{ev.impact}</span>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-[10px] text-emerald-400 font-semibold leading-snug">
          Inventory Transfer already approved
        </span>
      </div>
    </div>
  )
}

// ─── Event Timeline Item ──────────────────────────────────────────────────────
function EventItem({ event, isActive, onClick }) {
  const Icon = event.icon
  return (
    <div
      onClick={onClick}
      className={clsx(
        'flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 group',
        isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60',
      )}
      style={isActive ? { border: `1px solid ${event.border}` } : { border: '1px solid transparent' }}
    >
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{
            background: event.bg,
            border: `1px solid ${event.border}`,
            boxShadow: isActive ? `0 0 14px ${event.bg}` : 'none',
          }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color: event.color, width: '1.1rem', height: '1.1rem' }} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs font-bold text-white">{event.label}</span>
          <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold border', event.badge)}>
            {event.impact}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">{event.sub}</p>
        {isActive && (
          <p className="text-[11px] text-slate-400 leading-relaxed mt-1.5">{event.detail}</p>
        )}
      </div>

      <div className="text-right shrink-0">
        <p className="text-xs font-bold font-mono" style={{ color: event.color }}>{event.date}</p>
        <p className="text-[9px] text-slate-600 mt-0.5">2026</p>
      </div>
    </div>
  )
}

// ─── SKU Demand Row ───────────────────────────────────────────────────────────
function SkuDemandRow({ item, maxVal }) {
  const pct = Math.round((item.predicted / maxVal) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-36 shrink-0 truncate">{item.sku}</span>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: item.color }} />
      </div>
      <span className="text-xs font-bold w-12 text-right font-mono" style={{ color: item.color }}>{item.change}</span>
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
        {sub && <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Top Performing Stores Bar Chart ─────────────────────────────────────────
function TopStoresChart({ cityStores, cityAccent }) {
  // Sort descending by revenue, take top 5 (or all if fewer)
  const ranked = useMemo(() =>
    [...cityStores]
      .sort((a, b) => b.daily_revenue - a.daily_revenue)
      .slice(0, Math.min(cityStores.length, 8))
      .map((s, i) => ({
        name: s.name.replace(/^(Chennai|Bangalore|Coimbatore)\s/, ''),
        fullName: s.name,
        area: s.area,
        revenue: s.daily_revenue,
        rank: i + 1,
      })),
  [cityStores])

  const maxRev = ranked[0]?.revenue ?? 1

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
          <Trophy className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-white leading-none">Top Performing Stores</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Ranked by daily revenue</p>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ranked}
            layout="vertical"
            margin={{ top: 0, right: 50, left: 8, bottom: 0 }}
            barCategoryGap="20%"
          >
            <XAxis type="number" hide domain={[0, maxRev * 1.15]} />
            <YAxis
              type="category"
              dataKey="name"
              width={72}
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'Inter, system-ui' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<StoreBarTooltip />} cursor={{ fill: 'rgba(51,65,85,0.25)' }} />
            <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={14}>
              {ranked.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={i < 3 ? RANK_COLORS[i] : cityAccent}
                  fillOpacity={i < 3 ? 1 : 0.65}
                />
              ))}
              <LabelList
                dataKey="revenue"
                position="right"
                formatter={(v) => `\u20B9${(v / 1000).toFixed(0)}k`}
                style={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'Inter, system-ui' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rank legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {[['#f59e0b', '1st'], ['#94a3b8', '2nd'], ['#cd7c30', '3rd']].map(([c, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
            <span className="text-[10px] text-slate-500">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-1">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: cityAccent, opacity: 0.65 }} />
          <span className="text-[10px] text-slate-500">Others</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Analytics Page ──────────────────────────────────────────────────────
export default function Analytics() {
  const activeCity  = useAppStore((s) => s.activeCity)
  const activeStore = useAppStore((s) => s.activeStore)
  const stores      = useAppStore((s) => s.stores)
  const cities      = useAppStore((s) => s.cities)

  const [activeEvent, setActiveEvent] = useState(EVENTS[1])

  // Derived data
  const cityStores  = useMemo(() => stores.filter((s) => s.city_id === activeCity), [stores, activeCity])
  const cityObj     = useMemo(() => cities.find((c) => c.id === activeCity) ?? cities[0], [cities, activeCity])
  const theme       = CITY_THEME[activeCity] ?? CITY_THEME.chennai

  // Is this a city-wide (aggregated) view?
  const isAggregated = activeStore === 'all'

  // The store object for the selected store (null when aggregated)
  const selectedStore = useMemo(
    () => (isAggregated ? null : stores.find((s) => s.id === activeStore) ?? null),
    [isAggregated, stores, activeStore],
  )

  // Build chart data — re-computed any time city or store changes
  const chartData = useMemo(() => {
    if (isAggregated) return buildAggregatedChartData(cityStores)
    if (selectedStore) return buildStoreChartData(selectedStore.daily_revenue)
    return buildAggregatedChartData(cityStores)
  }, [isAggregated, cityStores, selectedStore])

  // Peak predicted value (for stat pill)
  const peakPredicted = useMemo(
    () => Math.max(...chartData.map((d) => d.predicted ?? 0)),
    [chartData],
  )

  // Chart key forces full remount (animation) on view switch
  const chartKey = `${activeCity}-${activeStore}`

  const maxSku = Math.max(...SKU_DEMAND.map((s) => s.predicted))

  // Mode label
  const modeLabel = isAggregated
    ? `City Overview — All ${cityObj.name} Stores`
    : selectedStore
    ? `${selectedStore.name} (${selectedStore.area})`
    : cityObj.name

  return (
    <div className="min-h-full animate-fade-in">

      {/* ── Page heading ────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">Demand Analytics</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Predictive Demand Engine</h1>

        {/* Mode badge */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
            style={{ background: `${theme.accent}18`, border: `1px solid ${theme.accent}40`, color: theme.accent }}
          >
            {isAggregated
              ? <Layers className="w-3 h-3" />
              : <Store className="w-3 h-3" />
            }
            {isAggregated ? 'Aggregated City View' : 'Single Store View'}
          </div>
          <p className="text-sm text-slate-400">
            <span className="text-white font-semibold">{modeLabel}</span>
            {' '}&mdash; {isAggregated
              ? `Combined forecast across ${cityStores.length} stores`
              : 'Individual store historical sales and AI predictions'
            }
          </p>
        </div>
      </div>

      {/* ── Stat strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatPill icon={Activity}    label="Forecast Horizon" value="14 days"                    color="bg-gradient-to-br from-cyan-500 to-blue-600" />
        <StatPill icon={TrendingUp}  label="Peak Predicted"   value={`${peakPredicted} units`}   color="bg-gradient-to-br from-purple-500 to-indigo-600" sub="Oct 20 · Monsoon" />
        <StatPill icon={Zap}         label="Events Tracked"   value="3 live"                     color="bg-gradient-to-br from-amber-500 to-orange-600" />
        <StatPill icon={BrainCircuit} label="AI Confidence"   value="94%"                        color="bg-gradient-to-br from-emerald-500 to-teal-600" sub="High confidence" />
      </div>

      {/* ══ TOP PANEL: Predictive Demand Chart ══════════════════════════════ */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 mb-6">

        {/* Panel header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Predictive Demand Chart</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Oct 11 – Oct 23 · {isAggregated ? 'All SKUs, all stores combined' : `${selectedStore?.name ?? ''} · All SKUs combined`}
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-blue-500 rounded" />
              <span className="text-[11px] text-slate-400">Historical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 rounded"
                style={{ height: 2, background: 'repeating-linear-gradient(90deg, #a855f7 0 5px, transparent 5px 10px)' }}
              />
              <span className="text-[11px] text-slate-400">AI Predicted</span>
            </div>
          </div>
        </div>

        {/* Chart + AI Insight sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div className="col-span-full lg:col-span-3" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                key={chartKey}
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <filter id="purple-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="blue-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.5} vertical={false} />

                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Inter, system-ui' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                  dy={6}
                />

                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Inter, system-ui' }}
                  axisLine={false}
                  tickLine={false}
                  dx={-4}
                />

                <Tooltip
                  content={<CustomTooltip isAggregated={isAggregated} />}
                  cursor={{ stroke: 'rgba(148,163,184,0.2)', strokeWidth: 1 }}
                />

                {/* Forecast boundary */}
                <ReferenceLine
                  x="Oct 17"
                  stroke="rgba(148,163,184,0.25)"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Forecast →',
                    position: 'insideTopRight',
                    fill: '#64748b',
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    dy: -4,
                  }}
                />

                {/* Event reference lines */}
                {EVENTS.map((ev) => (
                  <ReferenceLine
                    key={ev.id}
                    x={ev.date}
                    stroke={ev.color}
                    strokeOpacity={0.4}
                    strokeDasharray="3 3"
                    label={{
                      value: ev.label.split(' ')[0],
                      position: 'insideTopLeft',
                      fill: ev.color,
                      fontSize: 8,
                      fontWeight: 700,
                      dy: -4,
                    }}
                  />
                ))}

                {/* Historical — solid blue */}
                <Line
                  type="monotone"
                  dataKey="historical"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 0 }}
                  connectNulls={false}
                  filter="url(#blue-glow)"
                  isAnimationActive={true}
                  animationDuration={600}
                />

                {/* Predicted — dashed purple */}
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 5, fill: '#a855f7', strokeWidth: 0 }}
                  connectNulls={false}
                  filter="url(#purple-glow)"
                  isAnimationActive={true}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* AI Insight sidebar */}
          <div className="col-span-full lg:col-span-1">
            <AiInsightBox activeEvent={activeEvent} />
          </div>
        </div>

        {/* SKU demand breakdown */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Peak Demand Breakdown by SKU
          </p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
            {SKU_DEMAND.map((item) => (
              <SkuDemandRow key={item.sku} item={item} maxVal={maxSku} />
            ))}
          </div>
        </div>
      </div>

      {/* ══ BOTTOM PANEL: Events Timeline + Top Stores ═══════════════════════ */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Events Timeline (col-span-2) */}
          <div className="lg:col-span-2">
            {/* Panel header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-none">Upcoming Events Timeline</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Mapped to demand forecast · Click to explore</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Sparkles className="w-3 h-3 text-amber-400" />
                AI-correlated signals
              </div>
            </div>

            {/* Timeline dots */}
            <div className="relative mb-5">
              <div className="absolute top-3 left-0 right-0 h-px bg-slate-800" />
              <div className="relative flex justify-between px-5">
                {EVENTS.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setActiveEvent(ev)}
                    className="flex flex-col items-center gap-1.5 transition-all duration-200 active:scale-95"
                  >
                    <div
                      className="w-6 h-6 rounded-full border-2 z-10 transition-all duration-200 hover:scale-110"
                      style={{
                        background: activeEvent?.id === ev.id ? ev.color : 'rgba(15,23,42,0.9)',
                        borderColor: ev.color,
                        boxShadow: activeEvent?.id === ev.id ? `0 0 12px ${ev.color}` : 'none',
                      }}
                    />
                    <span className="text-[10px] font-bold font-mono" style={{ color: ev.color }}>{ev.date}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Event items */}
            <div className="space-y-2">
              {EVENTS.map((ev) => (
                <EventItem
                  key={ev.id}
                  event={ev}
                  isActive={activeEvent?.id === ev.id}
                  onClick={() => setActiveEvent(activeEvent?.id === ev.id ? null : ev)}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: Top Performing Stores (col-span-1) */}
          <div
            className="lg:col-span-1 rounded-xl p-4 flex flex-col"
            style={{
              background: 'rgba(15,23,42,0.7)',
              border: '1px solid rgba(51,65,85,0.7)',
              minHeight: 280,
            }}
          >
            <TopStoresChart cityStores={cityStores} cityAccent={theme.accent} />
          </div>
        </div>

        {/* AI note footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">AI Forecast Methodology</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Predictions are derived from a weighted ensemble of{' '}
              <span className="text-slate-400 font-semibold">historical sales velocity</span>,{' '}
              <span className="text-slate-400 font-semibold">IMD weather signals</span>,{' '}
              <span className="text-slate-400 font-semibold">festival calendars</span>, and{' '}
              <span className="text-slate-400 font-semibold">competitor stock levels</span>.
              The forecast boundary (Oct 17) separates confirmed actuals from probabilistic projections.
              {isAggregated
                ? ` City-level view aggregates data across all ${cityStores.length} ${cityObj.name} stores.`
                : selectedStore
                ? ` Store-level view shows individual data for ${selectedStore.name}.`
                : ''
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
