import React, { useEffect, useMemo, useState } from 'react'
import {
  MapPin, Truck, Package, Clock, Zap,
  Navigation, Radio, ArrowRight, Wifi,
  Activity, TrendingUp, Store, Building2,
} from 'lucide-react'
import { clsx } from 'clsx'
import useAppStore from '../../store/useStore'

// ─── CSS keyframes (injected once) ────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes truckAlongPath {
    0%   { offset-distance: 0%;   opacity: 1; }
    44%  { offset-distance: 100%; opacity: 1; }
    50%  { offset-distance: 100%; opacity: 0; }
    56%  { offset-distance: 0%;   opacity: 0; }
    60%  { offset-distance: 0%;   opacity: 1; }
    100% { offset-distance: 100%; opacity: 1; }
  }
  @keyframes dashFlow {
    to { stroke-dashoffset: -20; }
  }
  @keyframes dashFlowSlow {
    to { stroke-dashoffset: -20; }
  }
  @keyframes pingRing {
    0%   { transform: scale(1);   opacity: 0.7; }
    100% { transform: scale(2.8); opacity: 0;   }
  }
  @keyframes hubPulse {
    0%, 100% { opacity: 0.35; }
    50%       { opacity: 0.7;  }
  }
  @keyframes beaconBlink {
    0%, 100% { opacity: 1;   }
    50%       { opacity: 0.3; }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
`

function useInjectStyles() {
  useEffect(() => {
    const id = 'logistics-map-v2-styles'
    if (document.getElementById(id)) return
    const el = document.createElement('style')
    el.id = id
    el.textContent = KEYFRAMES
    document.head.appendChild(el)
    return () => { try { el.remove() } catch (_) {} }
  }, [])
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

// Distribute N store nodes in a circle around the central warehouse
function spokePositions(count, cx, cy, radius) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2  // start at top
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    }
  })
}

// ─── City accent colours ──────────────────────────────────────────────────────

const CITY_THEME = {
  chennai:    { hub: '#3b82f6', spoke: '#60a5fa', active: '#a855f7', glow: 'rgba(59,130,246,0.5)'  },
  bangalore:  { hub: '#10b981', spoke: '#34d399', active: '#f59e0b', glow: 'rgba(16,185,129,0.5)'  },
  coimbatore: { hub: '#f59e0b', spoke: '#fbbf24', active: '#3b82f6', glow: 'rgba(245,158,11,0.5)'  },
}

// ─── Intra-city shipment mock data (keyed by city) ────────────────────────────

const INTRA_SHIPMENTS = {
  chennai: [
    {
      id: 'TRN-9001',
      sku: 'SPF50 Sunscreen',
      quantity: 120,
      fromStoreId: 'chennai_store_2',
      toStoreId:   'chennai_store_7',
      fromLabel: 'Store 2 · T. Nagar',
      toLabel:   'Store 7 · Tambaram',
      progress: 38,
      timeRemaining: '~28 min',
      totalTime: '~45 min',
      driver: 'Murugan S.',
      vehicle: 'TN-01-AX-5512',
      decisionId: 'REC-001',
      priority: 'HIGH',
    },
  ],
  bangalore: [
    {
      id: 'TRN-9002',
      sku: 'Potato Chips',
      quantity: 400,
      fromStoreId: null,   // warehouse origin
      toStoreId:   'bangalore_store_5',
      fromLabel: 'BLR Warehouse · Peenya',
      toLabel:   'Store 5 · Jayanagar',
      progress: 55,
      timeRemaining: '~50 min',
      totalTime: '~1h 15m',
      driver: 'Suresh R.',
      vehicle: 'KA-03-MN-8821',
      decisionId: 'REC-002',
      priority: 'HIGH',
    },
  ],
  coimbatore: [],
}

// ─── SVG Network Map ──────────────────────────────────────────────────────────

const VB_W = 640
const VB_H = 480
const CX   = VB_W / 2     // centre x
const CY   = VB_H / 2     // centre y
const SPOKE_R = 170       // radius of spoke ring

function NetworkMap({ cityId, cityName, warehouse, cityStores, aiDecisions }) {
  const theme    = CITY_THEME[cityId] ?? CITY_THEME.chennai
  const positions = spokePositions(cityStores.length, CX, CY, SPOKE_R)

  // Find active intra-city transfers from AI decisions
  const activeTransfers = useMemo(() =>
    aiDecisions.filter(d =>
      (d.type === 'INTRA_CITY_TRANSFER' || d.type === 'INVENTORY_TRANSFER') &&
      d.city_id === cityId &&
      d.source_store_id && d.destination_store_id
    ),
    [aiDecisions, cityId]
  )

  // Also check the INTRA_SHIPMENTS mock for animated trucks
  const intraTrucks = INTRA_SHIPMENTS[cityId] ?? []

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(2,6,23,0.92)',
        border: '1px solid rgba(51,65,85,0.7)',
        backdropFilter: 'blur(16px)',
        minHeight: 460,
      }}
    >
      {/* Dotted radar grid */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(circle, rgba(71,85,105,0.45) 1px, transparent 1px)',
        backgroundSize: '26px 26px',
      }} />

      {/* Radial glow behind hub */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 55% 55% at 50% 50%, ${theme.hub}12 0%, transparent 68%)`,
      }} />

      {/* Corner badge */}
      <div style={{ position: 'absolute', top: 14, left: 16, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: '#10b981',
          display: 'inline-block',
          animation: 'beaconBlink 1.4s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Live · {cityName} Intra-City Network
        </span>
      </div>

      {/* Active transfer badge */}
      {activeTransfers.length > 0 && (
        <div style={{ position: 'absolute', top: 14, right: 16, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 8px', borderRadius: 20,
          background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a855f7',
            display: 'inline-block', animation: 'beaconBlink 1s infinite' }} />
          <span style={{ fontSize: 9, color: '#c084fc', fontWeight: 700, letterSpacing: '0.08em' }}>
            {activeTransfers.length} ACTIVE TRANSFER{activeTransfers.length > 1 ? 'S' : ''}
          </span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        style={{ position: 'relative', zIndex: 1, maxHeight: 460 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Hub glow filter */}
          <filter id="hub-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="spoke-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="truck-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Gradient for active edges */}
          <linearGradient id="activeEdge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#a855f7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="transferEdge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#22d3ee" stopOpacity="1" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="1" />
          </linearGradient>

          {/* Define motion paths for each active truck */}
          {intraTrucks.map((t, i) => {
            const srcIdx = cityStores.findIndex(s => s.id === t.fromStoreId)
            const dstIdx = cityStores.findIndex(s => s.id === t.toStoreId)
            const src = srcIdx >= 0 ? positions[srcIdx] : { x: CX, y: CY }
            const dst = dstIdx >= 0 ? positions[dstIdx] : { x: CX, y: CY }
            const mx  = (src.x + dst.x) / 2
            const my  = (src.y + dst.y) / 2 - 40   // curve control point
            return (
              <path
                key={`truck-path-${i}`}
                id={`truck-path-${i}`}
                d={`M ${src.x},${src.y} Q ${mx},${my} ${dst.x},${dst.y}`}
                fill="none"
              />
            )
          })}
        </defs>

        {/* ── Concentric ring decorations ── */}
        <circle cx={CX} cy={CY} r={SPOKE_R + 10}
          fill="none" stroke={theme.hub} strokeOpacity="0.05" strokeWidth="1"
          strokeDasharray="4 6" />
        <circle cx={CX} cy={CY} r={SPOKE_R + 30}
          fill="none" stroke={theme.hub} strokeOpacity="0.03" strokeWidth="1"
          strokeDasharray="3 8" />

        {/* ── Spoke lines: warehouse → each store ── */}
        {cityStores.map((store, i) => {
          const pos = positions[i]
          // Check if this store is part of an active transfer
          const isTransferSrc = activeTransfers.some(d => d.source_store_id === store.id)
          const isTransferDst = activeTransfers.some(d => d.destination_store_id === store.id)
          const isActive = isTransferSrc || isTransferDst

          return (
            <g key={`spoke-line-${store.id}`}>
              {/* Base spoke line */}
              <line
                x1={CX} y1={CY} x2={pos.x} y2={pos.y}
                stroke={isActive ? theme.hub : 'rgba(51,65,85,0.55)'}
                strokeWidth={isActive ? 1.5 : 1}
                strokeDasharray="5 5"
                style={isActive ? { animation: 'dashFlow 0.9s linear infinite' } : undefined}
              />
            </g>
          )
        })}

        {/* ── Active transfer lines (store-to-store) ── */}
        {activeTransfers.map((d, i) => {
          const srcIdx = cityStores.findIndex(s => s.id === d.source_store_id)
          const dstIdx = cityStores.findIndex(s => s.id === d.destination_store_id)
          if (srcIdx < 0 || dstIdx < 0) return null
          const src = positions[srcIdx]
          const dst = positions[dstIdx]
          const mx  = (src.x + dst.x) / 2
          const my  = (src.y + dst.y) / 2 - 45
          return (
            <g key={`transfer-edge-${d.decision_id}`}>
              {/* Glow shadow */}
              <path
                d={`M ${src.x},${src.y} Q ${mx},${my} ${dst.x},${dst.y}`}
                fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="10"
              />
              {/* Main animated line */}
              <path
                d={`M ${src.x},${src.y} Q ${mx},${my} ${dst.x},${dst.y}`}
                fill="none" stroke="url(#transferEdge)" strokeWidth="2.5"
                strokeDasharray="9 5"
                style={{ animation: 'dashFlow 0.7s linear infinite' }}
              />
              {/* Label */}
              <text
                x={mx} y={my - 8}
                textAnchor="middle" fontSize="8" fill="#22d3ee" fontWeight="700"
                fontFamily="Inter, system-ui, monospace" letterSpacing="0.5"
              >
                {d.sku} · {d.quantity}u
              </text>
            </g>
          )
        })}

        {/* ── Animated truck icons along active transfer paths ── */}
        {intraTrucks.map((t, i) => {
          const srcIdx = cityStores.findIndex(s => s.id === t.fromStoreId)
          const dstIdx = cityStores.findIndex(s => s.id === t.toStoreId)
          if (srcIdx < 0 || dstIdx < 0) return null
          return (
            <g
              key={`truck-anim-${i}`}
              style={{
                offsetPath: `path("M ${positions[srcIdx].x},${positions[srcIdx].y} Q ${
                  (positions[srcIdx].x + positions[dstIdx].x) / 2},${
                  (positions[srcIdx].y + positions[dstIdx].y) / 2 - 40} ${positions[dstIdx].x},${positions[dstIdx].y}")`,
                animation: `truckAlongPath ${7 + i * 3}s ease-in-out infinite ${i * 1.5}s`,
                offsetRotate: '0deg',
              }}
            >
              <circle cx="0" cy="0" r="9" fill="rgba(34,211,238,0.2)"
                style={{ animation: 'pingRing 1.5s ease-out infinite' }} />
              {/* Truck body */}
              <rect x="-8" y="-5" width="16" height="10" rx="2.5" fill="#22d3ee" filter="url(#truck-glow)" />
              <rect x="-3" y="-8" width="7" height="6" rx="1.5" fill="#67e8f9" />
              {/* Wheels */}
              <circle cx="-4.5" cy="5" r="2.5" fill="#0c4a6e" />
              <circle cx="4.5"  cy="5" r="2.5" fill="#0c4a6e" />
            </g>
          )
        })}

        {/* ── Hub Node: City Warehouse (centre) ── */}
        <g transform={`translate(${CX}, ${CY})`}>
          {/* Outer pulse ring */}
          <circle cx="0" cy="0" r="46"
            fill="none" stroke={theme.hub} strokeOpacity="0.18" strokeWidth="1"
            style={{ animation: 'hubPulse 2.5s ease-in-out infinite' }} />
          <circle cx="0" cy="0" r="38"
            fill="none" stroke={theme.hub} strokeOpacity="0.12" strokeWidth="1" />

          {/* Glow disc */}
          <circle cx="0" cy="0" r="32"
            fill={theme.hub} fillOpacity="0.18" filter="url(#hub-glow)" />

          {/* Hub circle */}
          <circle cx="0" cy="0" r="26"
            fill="rgba(2,6,23,0.9)"
            stroke={theme.hub} strokeWidth="2.5" strokeOpacity="0.9" />

          {/* Warehouse icon (simplified rect-based) */}
          {/* Building shape */}
          <rect x="-9" y="-8" width="18" height="14" rx="1.5"
            fill="none" stroke={theme.hub} strokeWidth="1.5" />
          <rect x="-5" y="-8" width="4" height="6" rx="0.5" fill={theme.hub} fillOpacity="0.6" />
          <rect x="1"  y="-8" width="4" height="6" rx="0.5" fill={theme.hub} fillOpacity="0.6" />
          <line x1="-9" y1="-2" x2="9" y2="-2" stroke={theme.hub} strokeWidth="1" strokeOpacity="0.5" />
          <line x1="0" y1="6"  x2="0" y2="-2"  stroke={theme.hub} strokeWidth="1" strokeOpacity="0.5" />

          {/* HUB label */}
          <text x="0" y="40" textAnchor="middle" fontSize="10" fontWeight="800"
            fill={theme.hub} fontFamily="Inter, system-ui" letterSpacing="1.5">
            WAREHOUSE
          </text>
          <text x="0" y="52" textAnchor="middle" fontSize="8"
            fill="#64748b" fontFamily="Inter, system-ui" letterSpacing="0.5">
            {warehouse?.warehouse_id ?? 'HUB'}
          </text>
        </g>

        {/* ── Spoke Nodes: Stores ── */}
        {cityStores.map((store, i) => {
          const pos         = positions[i]
          const isTransferSrc = activeTransfers.some(d => d.source_store_id === store.id)
          const isTransferDst = activeTransfers.some(d => d.destination_store_id === store.id)
          const hasCritical  = store.inventory.some(item => item.sales_velocity === 'High' && item.stock_level < 50)
          const hasOverstock = store.inventory.some(item => item.sales_velocity === 'Stagnant' && item.stock_level > 150)

          const nodeColor = isTransferSrc || isTransferDst
            ? '#22d3ee'
            : hasCritical  ? '#f87171'
            : hasOverstock ? '#fbbf24'
            : theme.spoke

          const glowFilter = isTransferSrc || isTransferDst ? 'url(#truck-glow)' : 'url(#spoke-glow)'

          return (
            <g key={store.id} transform={`translate(${pos.x}, ${pos.y})`}>
              {/* Outer ring */}
              {(isTransferSrc || isTransferDst) && (
                <circle cx="0" cy="0" r="22"
                  fill="none" stroke={nodeColor} strokeOpacity="0.3" strokeWidth="1"
                  style={{ animation: 'hubPulse 1.5s ease-in-out infinite' }} />
              )}

              {/* Glow disc */}
              <circle cx="0" cy="0" r="17"
                fill={nodeColor} fillOpacity={isTransferSrc || isTransferDst ? 0.2 : 0.08}
                filter={glowFilter} />

              {/* Node circle */}
              <circle cx="0" cy="0" r="13"
                fill="rgba(2,6,23,0.88)"
                stroke={nodeColor}
                strokeWidth={isTransferSrc || isTransferDst ? 2 : 1.5}
                strokeOpacity={isTransferSrc || isTransferDst ? 1 : 0.75} />

              {/* Store number */}
              <text x="0" y="1" textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fontWeight="800" fill={nodeColor}
                fontFamily="Inter, monospace">
                {i + 1}
              </text>

              {/* Status dot (top-right corner) */}
              {hasCritical && (
                <circle cx="10" cy="-10" r="3.5" fill="#f87171"
                  style={{ animation: 'beaconBlink 1s infinite' }} />
              )}
              {!hasCritical && hasOverstock && (
                <circle cx="10" cy="-10" r="3.5" fill="#fbbf24" />
              )}

              {/* Store area label */}
              <text
                x="0"
                y={pos.y < CY - 20 ? -20 : pos.y > CY + 20 ? 24 : (pos.x < CX ? -22 : 22)}
                textAnchor={pos.x < CX - 20 ? 'end' : pos.x > CX + 20 ? 'start' : 'middle'}
                fontSize="8.5" fontWeight={isTransferSrc || isTransferDst ? '800' : '600'}
                fill={isTransferSrc || isTransferDst ? '#22d3ee' : '#94a3b8'}
                fontFamily="Inter, system-ui"
              >
                {store.area}
              </text>

              {/* Transfer role badge */}
              {isTransferSrc && (
                <text x="0" y={pos.y < CY ? -30 : 34}
                  textAnchor="middle" fontSize="7" fill="#22d3ee" fontWeight="800"
                  fontFamily="monospace" letterSpacing="0.5">
                  SOURCE
                </text>
              )}
              {isTransferDst && (
                <text x="0" y={pos.y < CY ? -30 : 34}
                  textAnchor="middle" fontSize="7" fill="#818cf8" fontWeight="800"
                  fontFamily="monospace" letterSpacing="0.5">
                  DEST
                </text>
              )}
            </g>
          )
        })}

        {/* ── Legend strip ── */}
        <g transform={`translate(12, ${VB_H - 50})`}>
          <rect width="180" height="38" rx="6" fill="rgba(2,6,23,0.7)"
            stroke="rgba(51,65,85,0.5)" strokeWidth="1" />
          <circle cx="14" cy="12" r="4" fill={theme.hub} />
          <text x="24" y="16" fontSize="8" fill="#94a3b8" fontFamily="Inter" fontWeight="600">
            Warehouse Hub
          </text>
          <circle cx="14" cy="28" r="4" fill="#22d3ee" />
          <text x="24" y="32" fontSize="8" fill="#94a3b8" fontFamily="Inter" fontWeight="600">
            Active Transfer
          </text>
          <circle cx="110" cy="12" r="4" fill="#f87171"
            style={{ animation: 'beaconBlink 1s infinite' }} />
          <text x="120" y="16" fontSize="8" fill="#94a3b8" fontFamily="Inter" fontWeight="600">
            Critical Stock
          </text>
          <circle cx="110" cy="28" r="4" fill="#fbbf24" />
          <text x="120" y="32" fontSize="8" fill="#94a3b8" fontFamily="Inter" fontWeight="600">
            Overstock
          </text>
        </g>
      </svg>
    </div>
  )
}

// ─── Shipment Card ────────────────────────────────────────────────────────────

function ShipmentCard({ shipment, idx }) {
  const isHigh = shipment.priority === 'HIGH'
  const accent = isHigh
    ? { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)', text: '#c084fc', bar: 'linear-gradient(90deg,#7c3aed,#3b82f6,#7c3aed)' }
    : { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.3)',  text: '#34d399', bar: 'linear-gradient(90deg,#059669,#10b981,#059669)' }

  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.88)',
        border: `1px solid ${accent.border}`,
        borderRadius: 14,
        padding: 16,
        animation: `fadeSlideIn 0.35s ease ${idx * 0.1}s both`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.05em',
              padding: '2px 7px', borderRadius: 6,
              background: accent.bg, color: accent.text, border: `1px solid ${accent.border}`,
            }}>
              {shipment.id}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20,
              background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399',
                display: 'inline-block', animation: 'beaconBlink 1.2s infinite' }} />
              In Transit
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>{shipment.sku}</span>
            <span style={{ fontSize: 10, color: '#64748b' }}>× {shipment.quantity}</span>
          </div>
        </div>
        <div style={{
          width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: accent.bg, border: `1px solid ${accent.border}`, flexShrink: 0,
        }}>
          <Truck style={{ width: 16, height: 16, color: accent.text }} />
        </div>
      </div>

      {/* Route pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
        padding: '6px 10px', borderRadius: 8,
        background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(51,65,85,0.5)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1' }}>{shipment.fromLabel}</span>
        <ArrowRight style={{ width: 12, height: 12, color: '#475569', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc' }}>{shipment.toLabel}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>{shipment.totalTime}</span>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Transit Progress</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: accent.text }}>{shipment.progress}%</span>
        </div>
        <div style={{ width: '100%', height: 6, background: 'rgba(51,65,85,0.6)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${shipment.progress}%`,
            background: accent.bar, backgroundSize: '200% auto',
            animation: 'shimmer 2.5s linear infinite',
            transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      </div>

      {/* ETA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <Clock style={{ width: 13, height: 13, color: '#64748b' }} />
        <span style={{ fontSize: 10, color: '#64748b' }}>Time Remaining:</span>
        <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'monospace', color: '#f8fafc' }}>{shipment.timeRemaining}</span>
      </div>

      {/* Meta grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        paddingTop: 10, borderTop: '1px solid rgba(51,65,85,0.4)',
      }}>
        {[
          { label: 'Driver',      value: shipment.driver },
          { label: 'Vehicle',     value: shipment.vehicle },
          { label: 'Decision',    value: shipment.decisionId },
          { label: 'Priority',    value: shipment.priority },
        ].map(row => (
          <div key={row.label}>
            <p style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 1 }}>{row.label}</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: row.label === 'Decision' ? accent.text : '#cbd5e1', fontFamily: 'monospace' }}>{row.value}</p>
          </div>
        ))}
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

// ─── Store Roster (below map) ─────────────────────────────────────────────────

function StoreRosterStrip({ cityStores, cityId, activeTransfers }) {
  const theme = CITY_THEME[cityId] ?? CITY_THEME.chennai
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2 mt-4">
      {cityStores.map((store, i) => {
        const isTransferSrc = activeTransfers.some(d => d.source_store_id === store.id)
        const isTransferDst = activeTransfers.some(d => d.destination_store_id === store.id)
        const hasCritical   = store.inventory.some(item => item.sales_velocity === 'High' && item.stock_level < 50)
        const hasOverstock  = store.inventory.some(item => item.sales_velocity === 'Stagnant' && item.stock_level > 150)
        return (
          <div
            key={store.id}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200',
              isTransferSrc || isTransferDst
                ? 'bg-cyan-500/10 border border-cyan-500/30'
                : 'bg-slate-900/60 border border-slate-800',
            )}
          >
            <span className={clsx(
              'w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0',
              isTransferSrc || isTransferDst
                ? 'bg-cyan-500/20 text-cyan-300'
                : hasCritical
                  ? 'bg-red-500/20 text-red-300'
                  : hasOverstock
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-slate-800 text-slate-500',
            )}>
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-white truncate">{store.area}</p>
              <p className="text-[9px] text-slate-600 truncate">
                {isTransferSrc ? '⚡ Dispatch' : isTransferDst ? '📦 Receiving' : hasCritical ? '🔴 Critical' : hasOverstock ? '🟡 Overstock' : '✓ Healthy'}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main LogisticsMap Page ───────────────────────────────────────────────────

export default function LogisticsMap() {
  useInjectStyles()

  const activeCity   = useAppStore(s => s.activeCity)
  const currentStore = useAppStore(s => s.currentStore)
  const cities       = useAppStore(s => s.cities)
  const warehouses   = useAppStore(s => s.warehouses)
  const storesAll    = useAppStore(s => s.stores)
  const aiDecisions  = useAppStore(s => s.ai_decisions)

  const cityObj    = cities.find(c => c.id === activeCity) ?? cities[0]
  const warehouse  = warehouses.find(w => w.city_id === activeCity) ?? warehouses[0]
  const cityStores = useMemo(
    () => storesAll.filter(s => s.city_id === activeCity),
    [storesAll, activeCity],
  )

  // Active transfers for this city
  const activeTransfers = useMemo(() =>
    aiDecisions.filter(d =>
      (d.type === 'INTRA_CITY_TRANSFER' || d.type === 'WAREHOUSE_REPLENISHMENT') &&
      d.city_id === activeCity &&
      d.source_store_id && d.destination_store_id
    ),
    [aiDecisions, activeCity]
  )

  // Shipments for this city sidebar
  const cityShipments = INTRA_SHIPMENTS[activeCity] ?? []

  // Stats
  const totalUnits = cityShipments.reduce((s, t) => s + t.quantity, 0)
  const activeTrucks = cityShipments.length
  const criticalStores = cityStores.filter(s =>
    s.inventory.some(i => i.sales_velocity === 'High' && i.stock_level < 50)
  ).length

  return (
    <div className="min-h-full animate-fade-in">

      {/* ── Page heading ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
            <Navigation className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Logistics Map</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Intra-City Network</h1>
        <p className="text-sm text-slate-400 mt-1">
          <span className="text-blue-400 font-semibold">{cityObj.name}</span>
          <span className="text-slate-600 mx-1.5">·</span>
          <span className="text-slate-500">{cityStores.length} store nodes</span>
          <span className="text-slate-600 mx-1.5">·</span>
          {activeTransfers.length > 0 ? (
            <span className="text-cyan-400 font-semibold">{activeTransfers.length} active transfer{activeTransfers.length > 1 ? 's' : ''} in motion</span>
          ) : (
            <span className="text-slate-500">No active intra-city transfers</span>
          )}
        </p>
      </div>

      {/* ── Stat strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatPill icon={Truck}    label="Active Trucks"    value={activeTrucks}             color="bg-gradient-to-br from-purple-500 to-indigo-600" />
        <StatPill icon={Package}  label="Units In Transit" value={totalUnits.toLocaleString()} color="bg-gradient-to-br from-blue-500 to-cyan-600" />
        <StatPill icon={Activity} label="Critical Stores"  value={criticalStores}            color="bg-gradient-to-br from-red-500 to-rose-600" />
        <StatPill icon={Radio}    label="Store Spokes"     value={cityStores.length}         color="bg-gradient-to-br from-amber-500 to-orange-600" />
      </div>

      {/* ── Main 3-column grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: SVG Network Map (col-span-2) ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Hub & Spoke Topology
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                Live
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              {activeTrucks > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  {activeTrucks} truck{activeTrucks > 1 ? 's' : ''} in motion
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                  Network idle
                </>
              )}
            </div>
          </div>

          {/* The SVG Map */}
          <NetworkMap
            cityId={activeCity}
            cityName={cityObj.name}
            warehouse={warehouse}
            cityStores={cityStores}
            aiDecisions={aiDecisions}
          />

          {/* Store roster strip */}
          <StoreRosterStrip
            cityStores={cityStores}
            cityId={activeCity}
            activeTransfers={activeTransfers}
          />
        </div>

        {/* ── Right: Live Transit Fleet sidebar ── */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Live Transit Fleet
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-semibold">
                {cityShipments.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Wifi className="w-3 h-3" />
              Tracking
            </div>
          </div>

          {/* Shipment cards */}
          <div className="space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
            {cityShipments.length > 0 ? (
              cityShipments.map((shipment, i) => (
                <ShipmentCard key={shipment.id} shipment={shipment} idx={i} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-xl
                              bg-slate-900/50 border border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500">No active shipments</p>
                <p className="text-xs text-slate-600">for {cityObj.name}</p>
              </div>
            )}
          </div>

          {/* Fleet summary */}
          <div className="rounded-xl p-4" style={{
            background: 'rgba(15,23,42,0.7)',
            border: '1px solid rgba(51,65,85,0.6)',
          }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Fleet Summary</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Active City',         value: cityObj.name },
                { label: 'Store Network Size',  value: `${cityStores.length} nodes` },
                { label: 'AI Routed Today',     value: `${cityShipments.length} / ${cityShipments.length}` },
                { label: 'On-Time Rate',        value: '100%' },
                { label: 'Warehouse',           value: warehouse?.warehouse_id ?? '—' },
              ].map(row => (
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
