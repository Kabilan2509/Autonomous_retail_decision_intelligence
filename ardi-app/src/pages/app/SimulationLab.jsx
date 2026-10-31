import React, { useState, useEffect } from 'react'
import {
  FlaskConical,
  Play,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  ShieldAlert,
  Zap,
  Info
} from 'lucide-react'
import { api } from '../../services/api'

export default function SimulationLab() {
  const [scenarios, setScenarios] = useState([])
  const [selectedScenarioId, setSelectedScenarioId] = useState('SC002')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    api.getScenarios().then(data => {
      setScenarios(data || [])
    }).catch(console.error)
  }, [])

  const handleRun = async (scId) => {
    const idToRun = scId || selectedScenarioId
    setRunning(true)
    try {
      const res = await api.runScenario(idToRun)
      setResult(res)
    } catch (e) {
      alert('Scenario execution failed')
    } finally {
      setRunning(false)
    }
  }

  const activeScen = scenarios.find(s => s.scenario_id === selectedScenarioId)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-600/20 text-teal-400 border border-teal-500/30">
              <FlaskConical className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">Simulation Lab — Surprise Scenarios</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Test multi-agent autonomous resilience under sudden supply failures, demand spikes, and extreme weather.
          </p>
        </div>

        <button
          onClick={() => handleRun()}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-lg transition-all disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Simulating Event Impact...' : 'Inject & Run Scenario'}
        </button>
      </div>

      {/* Scenario Selector Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {scenarios.map(sc => {
          const isSelected = selectedScenarioId === sc.scenario_id
          return (
            <div
              key={sc.scenario_id}
              onClick={() => { setSelectedScenarioId(sc.scenario_id); handleRun(sc.scenario_id); }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-950/30 border-teal-500 shadow-md ring-1 ring-teal-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] font-bold text-teal-400">{sc.scenario_id}</span>
                <span className="text-[10px] text-slate-400">{sc.location}</span>
              </div>
              <h3 className="font-bold text-xs text-white line-clamp-1">{sc.scenario_type}</h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">Target: {sc.target_entity}</p>
            </div>
          )
        })}
      </div>

      {/* Simulation Result Box */}
      {result ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-bold uppercase">
                Scenario Executed: {result.scenario_id} — {result.scenario_type}
              </span>
              <h2 className="text-base font-bold text-white mt-1">
                Disruption in {result.location} ({result.target_entity})
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Injected Change: {result.injected_change}
              </p>
            </div>

            <div className="text-right text-xs text-slate-400">
              <span className="block text-[10px] text-slate-500">Execution Stamp</span>
              <span className="font-mono text-slate-300">{result.execution_timestamp}</span>
            </div>
          </div>

          {/* Autonomous Actions Triggered */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-teal-400" />
              Autonomous Agent Counter-Measures Activated
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.agent_actions_taken?.map((act, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial & Risk Delta */}
          {result.financial_delta && (
            <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-900/40 space-y-2">
              <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                Simulated Business Impact & Risk Protection
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {Object.entries(result.financial_delta).map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase block">{k.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-bold font-mono text-white">
                      {typeof v === 'number' ? `₹${v.toLocaleString()}` : v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resulting Decisions Feed */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Updated Real-Time Recommendations Generated by Orchestrator
            </h3>
            <div className="space-y-2">
              {result.decisions_generated?.slice(0, 5).map(dec => (
                <div key={dec.decision_id} className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-slate-400 mr-2">{dec.decision_id}</span>
                    <span className="font-semibold text-white">{dec.product_name}</span>
                    <span className="text-slate-400 text-[11px] ml-2">({dec.store_name})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-teal-400">{dec.action} ({dec.recommended_quantity} units)</span>
                    <span className="text-slate-400 text-[10px] font-mono">Confidence: {(dec.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <FlaskConical className="w-10 h-10 text-teal-400 mx-auto" />
          <h2 className="text-sm font-bold text-white">Select and Run Any of the 8 Surprise Scenarios</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click any scenario card above or press "Inject & Run Scenario" to demonstrate how the multi-agent system detects disruptions and recalculates retail decisions.
          </p>
        </div>
      )}
    </div>
  )
}
