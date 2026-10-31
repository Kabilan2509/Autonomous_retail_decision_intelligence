import React, { useEffect, useRef, useState } from 'react'
import {
  MapPin,
  Truck,
  Package,
  Clock,
  Zap,
  Navigation,
  Radio,
  ArrowRight,
  Wifi,
  Activity,
  CircleDot,
  TrendingUp,
} from 'lucide-react'
import { clsx } from 'clsx'
import useAppStore from '../../store/useStore'

// ─── Animation keyframes injected once ────────────────────────────────────────

const KEYFRAMES = `
  @keyframes truckMove {
    0%   { offset-distance: 0%;   opacity: 1; }
    45%  { offset-distance: 100%; opacity: 1; }
    50%  { offset-distance: 100%; opacity: 0; }
    55%  { offset-distance: 0%;   opacity: 0; }
    60%  { offset-distance: 0%;   opacity: 1; }
    100% { offset-distance: 100%; opacity: 1; }
  }
  @keyframes truckMove2 {
    0%   { offset-distance: 0%;   opacity: 1; }
    48%  { offset-distance: 100%; opacity: 1; }
    53%  { offset-distance: 100%; opacity: 0; }
    58%  { offset-distance: 0%;   opacity: 0; }
    63%  { offset-distance: 0%;   opacity: 1; }
    100% { offset-distance: 100%; opacity: 1; }
  }
  @keyframes pingRing {
    0%   { transform: scale(1);   opacity: 0.8; }
    100% { transform: scale(2.5); opacity: 0;   }
  }
  @keyframes dashFlow {
    to { stroke-dashoffset: -24; }
  }
  @keyframes nodePulse {
    0%, 100% { box-shadow: 0 0 12px rgba(59,130,246,0.4), 0 0 24px rgba(59,130,246,0.15); }
    50%       { box-shadow: 0 0 22px rgba(59,130,246,0.7), 0 0 48px rgba(59,130,246,0.25); }
  }
  @keyframes activeNodePulse {
    0%, 100% { box-shadow: 0 0 14px rgba(168,85,247,0.5), 0 0 30px rgba(168,85,247,0.2); }
    50%       { box-shadow: 0 0 28px rgba(168,85,247,0.9), 0 0 60px rgba(168,85,247,0.35); }
  }
  @keyframes radarSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes progressShimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes beaconPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
`

function useInjectStyles() {
  useEffect(() => {
    const id = 'logistics-map-styles'
    if (document.getElementById(id)) return
    const el = document.createElement('style')
    el.id = id
    el.textContent = KEYFRAMES
    document.head.appendChild(el)
    return () => el.remove()
  }, [])
}

// ─── Node config (SVG viewport: 600 × 400) ────────────────────────────────────

const NODES = [
  { id: 'S1', name: 'Chennai',     x: 460, y: 80,  color: '#3b82f6', glow: 'rgba(59,130,246,0.6)',  active: false },
  { id: 'S2', name: 'Coimbatore', x: 100, y: 320,  color: '#a855f7', glow: 'rgba(168,85,247,0.6)', active: true  },
  { id: 'S3', name: 'Palani',     x: 420, y: 330,  color: '#10b981', glow: 'rgba(16,185,129,0.6)', active: false },
]

const EDGES = [
  { from: 'S1', to: 'S2', active: true,  label: 'Active Transfer' }, // Coimbatore → Chennai
  { from: 'S1', to: 'S3', active: false, label: '' },
  { from: 'S2', to: 'S3', active: false, label: '' },
]

// ─── Shipment data ────────────────────────────────────────────────────────────

const SHIPMENTS = [
  {
    id: 'TRN-8842',
    sku: 'SPF50 Sunscreen',
    quantity: 200,
    from: 'Coimbatore',
    to: 'Chennai',
    progress: 65,
    timeRemaining: '2h 15m',
    totalTime: '6h 30m',
    driver: 'Rajan K.',
    vehicle: 'TN-38-BC-4421',
    tempC: '22°C',
    status: 'IN_TRANSIT',
    priority: 'HIGH',
    decisionId: 'REC-001',
  },
  {
    id: 'TRN-8843',
    sku: 'Festival Sweets',
    quantity: 150,
    from: 'Coimbatore',
    to: 'Palani',
    progress: 28,
    timeRemaining: '1h 17m',
    totalTime: '1h 45m',
    driver: 'Selvam P.',
    vehicle: 'TN-45-GH-7703',
    tempC: '24°C',
    status: 'IN_TRANSIT',
    priority: 'MEDIUM',
    decisionId: 'REC-003',
  },
]

// ─── Helper: find node by id ──────────────────────────────────────────────────

function getNode(id) { return NODES.find((n) => n.id === id) }

// ─── SVG Network Map ──────────────────────────────────────────────────────────

function NetworkMap({ currentStore }) {
  const W = 600
  const H = 400

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden flex items-center justify-center"
      style={{
        background: 'rgba(2,6,23,0.85)',
        border: '1px solid rgba(51,65,85,0.8)',
        backdropFilter: 'blur(12px)',
        minHeight: 420,
      }}
    >
      {/* Dotted grid background */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage:
            'radial-gradient(circle, rgba(71,85,105,0.55) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          zIndex: 0,
        }}
      />

      {/* Subtle radial glow in centre */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(59,130,246,0.06) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      {/* Corner tag */}
      <div
        style={{
          position: 'absolute', top: 14, left: 16, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: '#10b981',
          animation: 'beaconPulse 1.4s ease-in-out infinite',
          display: 'inline-block',
        }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Live Network · Tamil Nadu
        </span>
      </div>

      {/* SVG */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ position: 'relative', zIndex: 1, maxHeight: 400 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glow filters */}
          <filter id="glow-blue" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-purple" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-green" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Truck motion path — Coimbatore (100,320) → Chennai (460,80) */}
          <path
            id="truck-path-1"
            d="M 100,320 C 200,200 350,150 460,80"
            fill="none"
          />
          {/* Truck motion path — Coimbatore (100,320) → Palani (420,330) */}
          <path
            id="truck-path-2"
            d="M 100,320 C 200,300 300,300 420,330"
            fill="none"
          />

          {/* Active line gradient */}
          <linearGradient id="activeEdgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* ── Edges ── */}
        {EDGES.map((edge) => {
          const a = getNode(edge.from)
          const b = getNode(edge.to)
          if (!a || !b) return null
          const isS1S2 = (edge.from === 'S1' && edge.to === 'S2')
          const isS2S3 = (edge.from === 'S2' && edge.to === 'S3')

          if (isS1S2) {
            // Active curved line
            return (
              <g key={edge.from + edge.to}>
                {/* Shadow track */}
                <path
                  d="M 100,320 C 200,200 350,150 460,80"
                  fill="none"
                  stroke="rgba(168,85,247,0.12)"
                  strokeWidth="8"
                />
                {/* Animated flowing dash */}
                <path
                  d="M 100,320 C 200,200 350,150 460,80"
                  fill="none"
                  stroke="url(#activeEdgeGrad)"
                  strokeWidth="2"
                  strokeDasharray="8 6"
                  style={{ animation: 'dashFlow 0.8s linear infinite' }}
                />
              </g>
            )
          }

          if (isS2S3) {
            // Active curved line (second shipment)
            return (
              <g key={edge.from + edge.to}>
                <path
                  d="M 100,320 C 200,300 300,300 420,330"
                  fill="none"
                  stroke="rgba(16,185,129,0.12)"
                  strokeWidth="8"
                />
                <path
                  d="M 100,320 C 200,300 300,300 420,330"
                  fill="none"
                  stroke="rgba(16,185,129,0.7)"
                  strokeWidth="2"
                  strokeDasharray="8 6"
                  style={{ animation: 'dashFlow 1.2s linear infinite' }}
                />
              </g>
            )
          }

          // Passive straight line
          return (
            <line
              key={edge.from + edge.to}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="rgba(51,65,85,0.6)"
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
          )
        })}

        {/* ── Animated Truck 1: Coimbatore → Chennai ── */}
        <g style={{
          offsetPath: 'path("M 100,320 C 200,200 350,150 460,80")',
          animation: 'truckMove 8s ease-in-out infinite',
          offsetRotate: '0deg',
        }}>
          {/* Glow halo */}
          <circle cx="0" cy="0" r="10"
            fill="rgba(168,85,247,0.15)"
            style={{ animation: 'pingRing 1.4s ease-out infinite' }}
          />
          {/* Truck body */}
          <rect x="-7" y="-5" width="14" height="10" rx="2"
            fill="#a855f7" filter="url(#glow-purple)"
          />
          <rect x="-3" y="-7" width="6" height="5" rx="1"
            fill="#c084fc"
          />
          <circle cx="-4" cy="5" r="2" fill="#1e1b4b" />
          <circle cx="4"  cy="5" r="2" fill="#1e1b4b" />
        </g>

        {/* ── Animated Truck 2: Coimbatore → Palani ── */}
        <g style={{
          offsetPath: 'path("M 100,320 C 200,300 300,300 420,330")',
          animation: 'truckMove2 10s ease-in-out infinite 2s',
          offsetRotate: '0deg',
        }}>
          <circle cx="0" cy="0" r="10"
            fill="rgba(16,185,129,0.15)"
            style={{ animation: 'pingRing 1.8s ease-out infinite 0.5s' }}
          />
          <rect x="-7" y="-5" width="14" height="10" rx="2"
            fill="#10b981" filter="url(#glow-green)"
          />
          <rect x="-3" y="-7" width="6" height="5" rx="1"
            fill="#34d399"
          />
          <circle cx="-4" cy="5" r="2" fill="#022c22" />
          <circle cx="4"  cy="5" r="2" fill="#022c22" />
        </g>

        {/* ── Store Nodes ── */}
        {NODES.map((node) => {
          const isCurrentStore = node.name === currentStore
          const filterMap = { S1: 'url(#glow-blue)', S2: 'url(#glow-purple)', S3: 'url(#glow-green)' }

          return (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              {/* Outer ping ring */}
              <circle
                cx="0" cy="0" r="28"
                fill="none"
                stroke={node.color}
                strokeWidth="1"
                strokeOpacity="0.2"
              />
              {/* Glow disc */}
              <circle
                cx="0" cy="0" r="22"
                fill={node.color}
                fillOpacity={isCurrentStore ? 0.25 : 0.12}
                filter={filterMap[node.id]}
              />
              {/* Node ring */}
              <circle
                cx="0" cy="0" r="18"
                fill={isCurrentStore ? node.color : 'rgba(2,6,23,0.9)'}
                stroke={node.color}
                strokeWidth={isCurrentStore ? 2.5 : 1.5}
                strokeOpacity={isCurrentStore ? 1 : 0.7}
              />

              {/* MapPin icon (simplified SVG) */}
              <text
                x="0" y="1"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="13"
                fill={isCurrentStore ? '#fff' : node.color}
                fontFamily="system-ui"
              >
                ⬟
              </text>

              {/* Store name label */}
              <text
                x="0" y="36"
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={isCurrentStore ? '#f8fafc' : '#94a3b8'}
                fontFamily="Inter, system-ui, sans-serif"
                letterSpacing="0.5"
              >
                {node.name}
              </text>

              {/* Active store badge */}
              {isCurrentStore && (
                <text
                  x="0" y="48"
                  textAnchor="middle"
                  fontSize="8"
                  fill={node.color}
                  fontFamily="Inter, system-ui, sans-serif"
                  letterSpacing="1"
                >
                  ACTIVE STORE
                </text>
              )}

              {/* "Source" label for Coimbatore */}
              {node.id === 'S2' && (
                <text
                  x="0" y="48"
                  textAnchor="middle"
                  fontSize="8"
                  fill="#a855f7"
                  fontFamily="Inter, system-ui, sans-serif"
                  letterSpacing="1"
                >
                  DISPATCH HUB
                </text>
              )}
            </g>
          )
        })}

        {/* ── Shipment labels on lines ── */}
        <text x="260" y="175" textAnchor="middle" fontSize="9" fill="#a855f7"
          fontFamily="Inter, system-ui, sans-serif" fontWeight="600" letterSpacing="0.5">
          TRN-8842 · 200u SPF50 Sunscreen
        </text>
        <text x="250" y="295" textAnchor="middle" fontSize="9" fill="#10b981"
          fontFamily="Inter, system-ui, sans-serif" fontWeight="600" letterSpacing="0.5">
          TRN-8843 · 150u Festival Sweets
        </text>
      </svg>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 14, right: 16, zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end',
      }}>
        {[
          { color: '#a855f7', label: 'Coimbatore → Chennai' },
          { color: '#10b981', label: 'Coimbatore → Palani' },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 20, height: 2, background: l.color, borderRadius: 2 }} />
            <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Shipment Card ────────────────────────────────────────────────────────────

function ShipmentCard({ shipment, index }) {
  const priorityColor = shipment.priority === 'HIGH'
    ? { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', text: '#c084fc' }
    : { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.3)', text: '#34d399' }

  const progressColor = shipment.priority === 'HIGH'
    ? 'linear-gradient(90deg, #7c3aed, #3b82f6, #7c3aed)'
    : 'linear-gradient(90deg, #059669, #10b981, #059669)'

  return (
    <div
      className="rounded-xl p-4 transition-all duration-300 animate-fade-in"
      style={{
        background: 'rgba(15,23,42,0.85)',
        border: `1px solid ${priorityColor.border}`,
        boxShadow: `0 0 20px ${priorityColor.bg}`,
        animationDelay: `${index * 0.12}s`,
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-[10px] font-bold font-mono tracking-wider px-2 py-0.5 rounded-md"
              style={{ background: priorityColor.bg, color: priorityColor.text, border: `1px solid ${priorityColor.border}` }}
            >
              {shipment.id}
            </span>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#34d399', marginRight: 3, animation: 'beaconPulse 1.2s ease-in-out infinite', verticalAlign: 'middle' }} />
              In Transit
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Package className="w-3 h-3 text-slate-500" />
            <span className="text-xs font-semibold text-white">{shipment.sku}</span>
            <span className="text-[10px] text-slate-500">× {shipment.quantity}</span>
          </div>
        </div>
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
          style={{ background: priorityColor.bg, border: `1px solid ${priorityColor.border}` }}
        >
          <Truck className="w-4 h-4" style={{ color: priorityColor.text }} />
        </div>
      </div>

      {/* ── Route ── */}
      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(51,65,85,0.5)' }}>
        <span className="text-xs font-bold text-slate-300">{shipment.from}</span>
        <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
        <span className="text-xs font-bold text-white">{shipment.to}</span>
        <span className="ml-auto text-[10px] text-slate-600 font-mono">{shipment.totalTime} route</span>
      </div>

      {/* ── Progress bar ── */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Transit Progress</span>
          <span className="text-[11px] font-bold" style={{ color: priorityColor.text }}>{shipment.progress}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full relative overflow-hidden"
            style={{
              width: `${shipment.progress}%`,
              background: progressColor,
              backgroundSize: '200% auto',
              animation: 'progressShimmer 2.5s linear infinite',
              transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>
      </div>

      {/* ── ETA ── */}
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="text-[10px] text-slate-500">ETA Remaining:</span>
        <span
          className="text-xs font-bold font-mono"
          style={{ color: '#f8fafc' }}
        >
          {shipment.timeRemaining}
        </span>
      </div>

      {/* ── Meta row ── */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/60">
        <div>
          <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-0.5">Driver</p>
          <p className="text-[11px] font-semibold text-slate-300">{shipment.driver}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-0.5">Vehicle</p>
          <p className="text-[11px] font-semibold text-slate-400 font-mono">{shipment.vehicle}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-0.5">Cargo Temp</p>
          <p className="text-[11px] font-semibold text-slate-300">{shipment.tempC}</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-0.5">Decision ID</p>
          <p className="text-[11px] font-semibold font-mono" style={{ color: priorityColor.text }}>{shipment.decisionId}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className="glass-panel px-4 py-3 flex items-center gap-3">
      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', color)}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-base font-bold text-white leading-none">{value}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ─── Main LogisticsMap Page ───────────────────────────────────────────────────

export default function LogisticsMap() {
  useInjectStyles()

  const currentStore = useAppStore((s) => s.currentStore)
  const stores       = useAppStore((s) => s.stores)

  const totalUnitsInTransit = SHIPMENTS.reduce((s, t) => s + t.quantity, 0)
  const avgProgress         = Math.round(SHIPMENTS.reduce((s, t) => s + t.progress, 0) / SHIPMENTS.length)

  return (
    <div className="min-h-full animate-fade-in">

      {/* ── Page heading ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
            <Navigation className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Supply Chain</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Logistics Map</h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time AI-initiated transfer tracking
          {' · '}Active store: <span className="text-emerald-400 font-semibold">{currentStore}</span>
        </p>
      </div>

      {/* ── Stat strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatPill
          icon={Truck}
          label="Active Shipments"
          value={SHIPMENTS.length}
          color="bg-gradient-to-br from-purple-500 to-indigo-600"
        />
        <StatPill
          icon={Package}
          label="Units In Transit"
          value={totalUnitsInTransit.toLocaleString()}
          color="bg-gradient-to-br from-blue-500 to-cyan-600"
        />
        <StatPill
          icon={Activity}
          label="Avg. Progress"
          value={`${avgProgress}%`}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatPill
          icon={Radio}
          label="Network Nodes"
          value={stores.length}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>

      {/* ── Main 3-column grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: SVG Network Map (col-span-2) ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Section label */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Network Topology
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                Live
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              2 trucks in motion
            </div>
          </div>

          <NetworkMap currentStore={currentStore} />

          {/* Node info strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {NODES.map((node) => (
              <div
                key={node.id}
                className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-200"
                style={{
                  background: node.name === currentStore
                    ? `rgba(59,130,246,0.10)`
                    : 'rgba(15,23,42,0.6)',
                  border: node.name === currentStore
                    ? '1px solid rgba(59,130,246,0.35)'
                    : '1px solid rgba(51,65,85,0.5)',
                }}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    background: node.color,
                    boxShadow: `0 0 8px ${node.glow}`,
                  }}
                />
                <div>
                  <p className="text-xs font-bold text-white">{node.name}</p>
                  <p className="text-[9px] font-mono" style={{ color: node.color }}>{node.id}</p>
                </div>
                {node.name === currentStore && (
                  <span className="ml-auto text-[9px] font-bold text-blue-400">ACTIVE</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Live Transit Fleet sidebar (col-span-1) ── */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Sidebar header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Live Transit Fleet
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-semibold">
                {SHIPMENTS.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Wifi className="w-3 h-3" />
              Tracking
            </div>
          </div>

          {/* Shipment cards */}
          <div className="space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
            {SHIPMENTS.map((shipment, i) => (
              <ShipmentCard key={shipment.id} shipment={shipment} index={i} />
            ))}
          </div>

          {/* Fleet summary */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(15,23,42,0.7)',
              border: '1px solid rgba(51,65,85,0.6)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Fleet Summary</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Total Distance Today', value: '595 km' },
                { label: 'CO₂ Optimized',        value: '−12%' },
                { label: 'On-Time Rate',          value: '100%' },
                { label: 'AI Routed',             value: '2 / 2' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">{row.label}</span>
                  <span className="text-[11px] font-bold text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
