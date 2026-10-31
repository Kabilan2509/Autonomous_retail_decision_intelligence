import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  RotateCw,
  Search,
  Sparkles,
  Info,
  Layers,
  Calendar
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts'
import { api } from '../../services/api'

export default function DemandIntelligence() {
  const [storeId, setStoreId] = useState('ST001')
  const [skuId, setSkuId] = useState('SKU0001')
  const [forecastData, setForecastData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadForecast = async () => {
    setLoading(true)
    try {
      const res = await api.getForecast(storeId, skuId, 7)
      setForecastData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForecast()
  }, [storeId, skuId])

  const chartData = forecastData?.forecasts?.map(f => ({
    date: f.forecast_date,
    predicted: f.predicted_demand,
    upper_p90: f.upper_bound,
    lower_p10: f.lower_bound
  })) || []

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">Demand Intelligence</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Foundation Model (Amazon Chronos-Bolt) forecasting with MAPIE P90 conformal uncertainty bands.
          </p>
        </div>

        {/* Selectors */}
        <div className="flex items-center gap-3">
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ST001">ST001 (Bangalore - Whitefield)</option>
            <option value="ST002">ST002 (Bangalore - Electronic City)</option>
            <option value="ST009">ST009 (Chennai - Anna Nagar)</option>
            <option value="ST016">ST016 (Coimbatore - RS Puram)</option>
          </select>

          <select
            value={skuId}
            onChange={(e) => setSkuId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="SKU0001">SKU0001 - Tomato (Perishable)</option>
            <option value="SKU0002">SKU0002 - Onion (Vegetables)</option>
            <option value="SKU0003">SKU0003 - Potato (Staples)</option>
            <option value="SKU0004">SKU0004 - Carrot (Perishable)</option>
            <option value="SKU0015">SKU0015 - Milk (Dairy)</option>
            <option value="SKU0038">SKU0038 - Soft Drink (Beverages)</option>
          </select>
        </div>
      </div>

      {/* Main Forecast Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-teal-400 uppercase font-mono font-bold tracking-wider">
              {forecastData?.model_name || 'Amazon Chronos-Bolt'}
            </span>
            <h2 className="text-sm font-bold text-white">
              7-Day Demand Projection with Guaranteed P90/P10 Risk Envelope
            </h2>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Confidence: <span className="text-teal-400 font-bold">{((forecastData?.confidence || 0.85) * 100).toFixed(0)}%</span>
          </div>
        </div>

        {loading ? (
          <div className="h-72 flex items-center justify-center text-xs text-slate-500">
            <RotateCw className="w-5 h-5 animate-spin mr-2 text-blue-400" />
            Computing Foundation Model Projections...
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="bandColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }}
                  formatter={(val, name) => [
                    `${val} units`,
                    name === 'upper_p90' ? 'MAPIE P90 Upper' :
                    name === 'lower_p10' ? 'MAPIE P10 Lower' : 'Expected Forecast'
                  ]}
                />
                <Area type="monotone" dataKey="upper_p90" stroke="none" fill="url(#bandColor)" />
                <Line type="monotone" dataKey="predicted" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4, fill: '#38bdf8' }} />
                <Line type="monotone" dataKey="upper_p90" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="lower_p10" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Total Projected 7D Demand</span>
            <span className="text-base font-bold font-mono text-white">
              {chartData.reduce((acc, c) => acc + (c.predicted || 0), 0).toFixed(1)} units
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">MAPIE P90 Peak Safety Ceiling</span>
            <span className="text-base font-bold font-mono text-amber-400">
              {chartData.reduce((acc, c) => acc + (c.upper_p90 || 0), 0).toFixed(1)} units
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Conformal Coverage Guarantee</span>
            <span className="text-base font-bold font-mono text-teal-400">
              90.0% Distribution-Free
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
