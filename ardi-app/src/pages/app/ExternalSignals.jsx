import React, { useState, useEffect } from 'react'
import {
  Globe2,
  CloudRain,
  Sun,
  AlertTriangle,
  RotateCw,
  Calendar,
  ExternalLink,
  MapPin,
  Sparkles
} from 'lucide-react'
import { api } from '../../services/api'

export default function ExternalSignals() {
  const [news, setNews] = useState([])
  const [weather, setWeather] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getNewsSignals(), api.getWeatherSignals()])
      .then(([nData, wData]) => {
        setNews(nData.signals || [])
        setWeather(wData.signals || [])
      })
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
              <Globe2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">External Signals & Contextual Intelligence</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            DeBERTa-v3 NLP disruption extraction and localized meteorological demand shocks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* News Signals Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              DeBERTa-v3 Disruption Signals
            </h2>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
              Synthetic Sandbox Feed
            </span>
          </div>

          <div className="space-y-3">
            {news.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-teal-400 font-bold">{item.news_id}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold">
                      {item.event_type}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" /> {item.location}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Confidence: {(item.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <h3 className="font-semibold text-xs text-white">{item.headline}</h3>

                <div className="flex flex-wrap gap-1">
                  {item.affected_categories?.map((c, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px]">
                      {c}
                    </span>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Calibrated Demand Uplift: <span className="text-white font-mono font-bold">{item.calibrated_demand_multiplier}x</span></span>
                  <span className="text-[10px] text-slate-500 font-mono">Model: {item.model_used}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Intelligence */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-blue-400" />
            Regional Weather & Delivery Risk
          </h2>

          <div className="space-y-3">
            {weather.map((w, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{w.location}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    w.risk_level === 'HIGH' ? 'bg-rose-500/20 text-rose-300' :
                    w.risk_level === 'ELEVATED' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {w.risk_level}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Temperature</span>
                    <span className="font-mono font-bold text-white">{w.temperature_c}°C</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Rainfall</span>
                    <span className="font-mono font-bold text-white">{w.rainfall_mm} mm</span>
                  </div>
                </div>

                {w.affected_categories?.length > 0 && (
                  <div className="text-[11px] text-slate-400 pt-1">
                    Affected Categories: <span className="text-teal-400">{w.affected_categories.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
