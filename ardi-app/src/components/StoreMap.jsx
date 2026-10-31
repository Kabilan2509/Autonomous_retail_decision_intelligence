import React, { useState, useRef, useEffect } from 'react'
import {
  MapPin,
  Building2,
  AlertTriangle,
  Boxes,
  Truck,
  RotateCcw,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
  ShieldAlert,
  ArrowRight,
  Hand,
  Compass
} from 'lucide-react'

// Geographic bounds for Southern India (Bangalore, Chennai, Coimbatore)
const MAP_BOUNDS = {
  minLat: 10.6,
  maxLat: 13.4,
  minLng: 76.6,
  maxLng: 80.5,
}

// City cluster presets
const CLUSTERS = {
  ALL: { name: 'All Clusters', zoom: 1, panX: 0, panY: 0 },
  BANGALORE: { name: 'Bangalore (8 Stores)', zoom: 2.2, panX: 180, panY: -80 },
  CHENNAI: { name: 'Chennai (7 Stores)', zoom: 2.4, panX: -260, panY: -90 },
  COIMBATORE: { name: 'Coimbatore (5 Stores)', zoom: 2.5, panX: 300, panY: 260 },
}

export default function StoreMap({ stores = [], onSelectStore, selectedStoreId }) {
  const [activeCluster, setActiveCluster] = useState('ALL')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [hoveredStore, setHoveredStore] = useState(null)
  const [showRoutes, setShowRoutes] = useState(true)
  const [selectedStore, setSelectedStore] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const containerRef = useRef(null)

  const width = 860
  const height = 500

  // Coordinate projection to SVG canvas with Zoom and Pan
  const project = (lat, lng) => {
    const normX = (lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)
    const normY = (lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)

    // Base coordinates
    const baseX = normX * (width - 160) + 80
    const baseY = height - (normY * (height - 120) + 60)

    // Apply zoom around center + pan offset
    const centerX = width / 2
    const centerY = height / 2

    const finalX = centerX + (baseX - centerX) * zoomLevel + pan.x
    const finalY = centerY + (baseY - centerY) * zoomLevel + pan.y

    return { x: finalX, y: finalY }
  }

  // Interactive Mouse Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87
    setZoomLevel(prev => Math.min(Math.max(prev * zoomFactor, 0.75), 5.0))
  }

  // Mouse Drag to Pan
  const handleMouseDown = (e) => {
    // Only drag on canvas background, not when clicking a store node
    if (e.target.tagName !== 'circle' && e.target.tagName !== 'text') {
      setIsDragging(true)
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleClusterSelect = (key) => {
    setActiveCluster(key)
    const preset = CLUSTERS[key]
    setZoomLevel(preset.zoom)
    setPan({ x: preset.panX, y: preset.panY })
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.35, 5.0))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.35, 0.75))
  }

  const handleReset = () => {
    setZoomLevel(1)
    setPan({ x: 0, y: 0 })
    setActiveCluster('ALL')
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Navigation className="w-4 h-4" />
            </span>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Geospatial Network & Store Risk Topology
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Interactive Zoom & Pan (Wheel / Buttons / Drag) · 100% Offline Vector GIS · No API Key Required
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Cluster Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
            {Object.keys(CLUSTERS).map(key => (
              <button
                key={key}
                onClick={() => handleClusterSelect(key)}
                className={`px-2.5 py-1 rounded font-semibold transition-all ${
                  activeCluster === key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {key === 'ALL' ? 'All Clusters' : key.charAt(0) + key.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Interactive Zoom Buttons & Reset */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-slate-300">
            <button
              onClick={handleZoomIn}
              className="px-2 py-1 hover:bg-slate-800 rounded text-slate-200 hover:text-white flex items-center gap-1 text-xs font-bold"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5 text-teal-400" />
              <span>+</span>
            </button>
            <span className="text-[10px] font-mono text-slate-400 px-1 border-x border-slate-800">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              className="px-2 py-1 hover:bg-slate-800 rounded text-slate-200 hover:text-white flex items-center gap-1 text-xs font-bold"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5 text-teal-400" />
              <span>-</span>
            </button>
            <button
              onClick={handleReset}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white ml-0.5"
              title="Reset Zoom & Pan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Route toggle */}
          <button
            onClick={() => setShowRoutes(!showRoutes)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              showRoutes
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {showRoutes ? 'Routes: ON' : 'Routes: OFF'}
          </button>
        </div>
      </div>

      {/* Interactive Vector GIS Canvas */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full h-[480px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Coordinate grid lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <defs>
            <linearGradient id="bayOfBengal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#082f49" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.15" />
            </linearGradient>

            <linearGradient id="routeGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* East Coast / Bay of Bengal Decorative Contour */}
          <path
            d="M 680 0 Q 720 120, 730 220 T 780 400 T 820 500 L 860 500 L 860 0 Z"
            fill="url(#bayOfBengal)"
            stroke="#0369a1"
            strokeWidth="0.8"
            strokeOpacity="0.3"
          />
          <text x="790" y="240" fill="#0284c7" fillOpacity="0.25" fontSize="12" fontWeight="bold" transform="rotate(75, 790, 240)">
            BAY OF BENGAL
          </text>

          {/* Regional Labels */}
          <text x="240" y="80" fill="#334155" fontSize="22" fontWeight="900" letterSpacing="4" opacity="0.35">
            KARNATAKA
          </text>
          <text x="480" y="380" fill="#334155" fontSize="22" fontWeight="900" letterSpacing="4" opacity="0.35">
            TAMIL NADU
          </text>

          {/* Cluster Catchment Zones */}
          {/* Bangalore Cluster */}
          <g transform={`translate(${project(12.97, 77.60).x}, ${project(12.97, 77.60).y})`}>
            <circle r={65 * zoomLevel} fill="#3b82f6" fillOpacity="0.04" stroke="#3b82f6" strokeOpacity="0.2" strokeDasharray="4 4" />
            <text y={-70 * zoomLevel} fill="#60a5fa" fontSize={Math.max(9, 9 * zoomLevel * 0.7)} fontWeight="bold" textAnchor="middle">
              BANGALORE (8 STORES)
            </text>
          </g>

          {/* Chennai Cluster */}
          <g transform={`translate(${project(13.12, 80.27).x}, ${project(13.12, 80.27).y})`}>
            <circle r={60 * zoomLevel} fill="#14b8a6" fillOpacity="0.04" stroke="#14b8a6" strokeOpacity="0.2" strokeDasharray="4 4" />
            <text y={-65 * zoomLevel} fill="#2dd4bf" fontSize={Math.max(9, 9 * zoomLevel * 0.7)} fontWeight="bold" textAnchor="middle">
              CHENNAI (7 STORES)
            </text>
          </g>

          {/* Coimbatore Cluster */}
          <g transform={`translate(${project(11.04, 76.93).x}, ${project(11.04, 76.93).y})`}>
            <circle r={55 * zoomLevel} fill="#8b5cf6" fillOpacity="0.04" stroke="#8b5cf6" strokeOpacity="0.2" strokeDasharray="4 4" />
            <text y={-60 * zoomLevel} fill="#a78bfa" fontSize={Math.max(9, 9 * zoomLevel * 0.7)} fontWeight="bold" textAnchor="middle">
              COIMBATORE (5 STORES)
            </text>
          </g>

          {/* Google OR-Tools Lateral Transshipment Route Arcs */}
          {showRoutes && stores.length > 0 && (
            <g className="logistics-routes">
              {/* Route 1: Bangalore ST001 to ST006 */}
              {(() => {
                const p1 = project(12.97072, 77.62923)
                const p2 = project(12.96165, 77.61914)
                return (
                  <path
                    d={`M ${p1.x} ${p1.y} Q ${(p1.x + p2.x) / 2 + 15 * zoomLevel} ${(p1.y + p2.y) / 2 - 20 * zoomLevel} ${p2.x} ${p2.y}`}
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth={Math.max(1.8, 1.8 * zoomLevel * 0.7)}
                    strokeDasharray="5 3"
                  />
                )
              })()}

              {/* Route 2: Chennai ST009 to ST012 */}
              {(() => {
                const p1 = project(13.16920, 80.28876)
                const p2 = project(13.11660, 80.26859)
                return (
                  <path
                    d={`M ${p1.x} ${p1.y} Q ${(p1.x + p2.x) / 2 - 20 * zoomLevel} ${(p1.y + p2.y) / 2} ${p2.x} ${p2.y}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={Math.max(1.8, 1.8 * zoomLevel * 0.7)}
                    strokeDasharray="4 4"
                  />
                )
              })()}

              {/* Route 3: Coimbatore ST018 to ST016 */}
              {(() => {
                const p1 = project(11.05909, 76.94195)
                const p2 = project(11.01161, 76.91885)
                return (
                  <path
                    d={`M ${p1.x} ${p1.y} Q ${(p1.x + p2.x) / 2 + 15 * zoomLevel} ${(p1.y + p2.y) / 2} ${p2.x} ${p2.y}`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={Math.max(1.8, 1.8 * zoomLevel * 0.7)}
                    strokeDasharray="4 4"
                  />
                )
              })()}
            </g>
          )}

          {/* Store Pin Nodes (20 Stores) */}
          {stores.map(s => {
            const pos = project(s.latitude, s.longitude)
            const isSelected = selectedStoreId === s.store_id || selectedStore?.store_id === s.store_id
            const isHovered = hoveredStore?.store_id === s.store_id
            const isCritical = s.status === 'CRITICAL_RISK'
            const isModerate = s.status === 'MODERATE_RISK'

            const pinColor = isCritical ? '#f43f5e' : isModerate ? '#f59e0b' : '#10b981'
            const radius = isSelected ? 8 * Math.max(1, zoomLevel * 0.6) : 6 * Math.max(1, zoomLevel * 0.6)

            return (
              <g
                key={s.store_id}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedStore(s)
                  if (onSelectStore) onSelectStore(s)
                }}
                onMouseEnter={() => setHoveredStore(s)}
                onMouseLeave={() => setHoveredStore(null)}
              >
                {/* Critical Risk Pulse Ping */}
                {isCritical && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius * 2.2}
                    fill="#f43f5e"
                    fillOpacity="0.2"
                    className="animate-ping"
                  />
                )}

                {/* Selection Halo */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius * 1.8}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Node Solid Circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={pinColor}
                  stroke="#020617"
                  strokeWidth="2"
                  className="drop-shadow-lg"
                />

                {/* Store Label */}
                <text
                  x={pos.x}
                  y={pos.y - radius - 4}
                  fill="#f8fafc"
                  fontSize={Math.max(8.5, 8.5 * zoomLevel * 0.7)}
                  fontWeight="600"
                  textAnchor="middle"
                  className="pointer-events-none drop-shadow"
                >
                  {s.neighborhood}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Floating Zoom & Pan Controls on Canvas */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 shadow-lg backdrop-blur-md">
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-teal-400" />
          </button>
          <div className="h-px bg-slate-800 my-0.5" />
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-teal-400" />
          </button>
          <div className="h-px bg-slate-800 my-0.5" />
          <button
            onClick={handleReset}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            title="Reset Map View"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Store Inspector Overlay */}
        {(selectedStore || hoveredStore) && (
          <div className="absolute top-4 right-4 z-20 p-4 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs space-y-2 max-w-xs animate-in fade-in">
            {(() => {
              const cur = hoveredStore || selectedStore
              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-teal-400 font-bold">{cur.store_id}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      cur.status === 'CRITICAL_RISK' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      cur.status === 'MODERATE_RISK' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {cur.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm">{cur.store_name}</h3>
                  <p className="text-[11px] text-slate-400">
                    {cur.neighborhood}, <span className="text-teal-400 font-semibold">{cur.location}</span> ({cur.store_type})
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block uppercase">Stockout Risks</span>
                      <span className="font-bold text-rose-400 font-mono">{cur.stockout_skus || 0} SKUs</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block uppercase">Capacity</span>
                      <span className="font-bold text-slate-200 font-mono">{cur.capacity_units?.toLocaleString()} u</span>
                    </div>
                  </div>

                  <div className="pt-1 text-[10px] text-slate-400 flex justify-between font-mono">
                    <span>GPS: {cur.latitude.toFixed(3)}, {cur.longitude.toFixed(3)}</span>
                    <span>₹{cur.operating_cost_per_day?.toFixed(0)}/d</span>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] space-y-1.5 backdrop-blur-md">
          <div className="font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Store Health Status</div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-300" /> Healthy (Within Buffer)
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-300" /> Moderate (Reorder Alert)
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-300 animate-pulse" /> Critical Risk (Breached Point)
          </div>
          <div className="flex items-center gap-2 text-slate-400 pt-1 border-t border-slate-800">
            <span className="w-4 h-0.5 border-t border-dashed border-sky-400" /> Lateral Transfer Vector
          </div>
        </div>
      </div>
    </div>
  )
}
