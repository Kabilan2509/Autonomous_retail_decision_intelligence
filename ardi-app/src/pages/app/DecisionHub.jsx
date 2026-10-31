import React, { useState, useEffect } from 'react'
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Boxes,
  HelpCircle
} from 'lucide-react'
import { api } from '../../services/api'

export default function DecisionHub() {
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDecision, setSelectedDecision] = useState(null)
  const [actionFilter, setActionFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [generating, setGenerating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const loadDecisions = async () => {
    setLoading(true)
    try {
      const data = await api.getDecisions(60)
      setDecisions(data.decisions || [])
      if (data.decisions && data.decisions.length > 0 && !selectedDecision) {
        setSelectedDecision(data.decisions[0])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDecisions()
  }, [])

  const handleApprove = async (id) => {
    try {
      await api.approveDecision(id)
      setDecisions(prev => prev.map(d => d.decision_id === id ? { ...d, approval_status: 'APPROVED' } : d))
      if (selectedDecision && selectedDecision.decision_id === id) {
        setSelectedDecision(prev => ({ ...prev, approval_status: 'APPROVED' }))
      }
    } catch (e) {
      alert('Approval failed')
    }
  }

  const handleReject = async (id) => {
    try {
      await api.rejectDecision(id)
      setDecisions(prev => prev.map(d => d.decision_id === id ? { ...d, approval_status: 'REJECTED' } : d))
      if (selectedDecision && selectedDecision.decision_id === id) {
        setSelectedDecision(prev => ({ ...prev, approval_status: 'REJECTED' }))
      }
    } catch (e) {
      alert('Rejection failed')
    }
  }

  const handleRunOrchestrator = async () => {
    setGenerating(true)
    try {
      await api.generateDecisions(null, 50)
      await loadDecisions()
    } finally {
      setGenerating(false)
    }
  }

  const filteredDecisions = decisions.filter(d => {
    if (actionFilter !== 'ALL' && d.action !== actionFilter) return false
    if (statusFilter !== 'ALL' && d.approval_status !== statusFilter) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchName = (d.product_name || '').toLowerCase().includes(term)
      const matchStore = (d.store_name || '').toLowerCase().includes(term)
      const matchSku = (d.sku_id || '').toLowerCase().includes(term)
      if (!matchName && !matchStore && !matchSku) return false
    }
    return true
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <BrainCircuit className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">AI Decision Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous multi-agent recommendations under verified constraints with human oversight.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunOrchestrator}
            disabled={generating}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Orchestrating...' : 'Trigger Intelligence Cycle'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search SKU, Product, Store..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Actions</option>
          <option value="REPLENISH">REPLENISH</option>
          <option value="TRANSFER">TRANSFER</option>
          <option value="MARKDOWN">MARKDOWN</option>
          <option value="INCREASE_ALLOCATION">INCREASE ALLOCATION</option>
          <option value="NO_ACTION">NO ACTION</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Approval States</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="HUMAN_REVIEW">HUMAN REVIEW REQUIRED</option>
        </select>

        <div className="flex items-center justify-end text-xs text-slate-400">
          Showing <span className="text-white font-semibold mx-1">{filteredDecisions.length}</span> recommendations
        </div>
      </div>

      {/* Main Grid: Feed + Drill-down Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Decision Feed */}
        <div className="lg:col-span-7 space-y-3">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
              Loading real-time decisions...
            </div>
          ) : filteredDecisions.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-xl text-slate-500 text-xs">
              No recommendations match selected filters.
            </div>
          ) : (
            filteredDecisions.map((dec) => {
              const isSelected = selectedDecision?.decision_id === dec.decision_id
              return (
                <div
                  key={dec.decision_id}
                  onClick={() => setSelectedDecision(dec)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-950/20 border-blue-500 shadow-md'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-400">{dec.decision_id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                          dec.action === 'REPLENISH' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          dec.action === 'TRANSFER' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          dec.action === 'MARKDOWN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          dec.action === 'INCREASE_ALLOCATION' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {dec.action} {dec.recommended_quantity > 0 ? `(${dec.recommended_quantity} units)` : ''}
                        </span>
                        {dec.priority === 'HIGH' && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[9px] font-bold border border-rose-500/20">
                            HIGH PRIORITY
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-white mt-1">
                        {dec.product_name} <span className="text-xs text-slate-400 font-normal">({dec.sku_id})</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        {dec.store_name} · <span className="text-teal-400">{dec.location}</span> · Category: {dec.category}
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        dec.approval_status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                        dec.approval_status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300' :
                        dec.approval_status === 'HUMAN_REVIEW' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {dec.approval_status}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1 font-mono">
                        Confidence: {(dec.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 line-clamp-2 bg-slate-950/40 p-2 rounded border border-slate-800/60">
                    {dec.reasoning}
                  </p>
                </div>
              )
            })
          )}
        </div>

        {/* Right: Selected Decision Detailed Rationale ("The Why") */}
        <div className="lg:col-span-5 sticky top-6">
          {selectedDecision ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Inspecting</span>
                  <h2 className="text-base font-bold text-white">{selectedDecision.decision_id}</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(selectedDecision.decision_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedDecision.decision_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>

              {/* Rationale Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
                  <BrainCircuit className="w-4 h-4" />
                  Decision Rationale ("The Why" — Qwen-2.5-7B)
                </div>
                <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs leading-relaxed text-slate-200">
                  {selectedDecision.reasoning}
                </div>
              </div>

              {/* Supporting Evidence */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Supporting Evidence Vector</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedDecision.evidence?.map((ev, i) => (
                    <div key={i} className="p-2.5 rounded bg-slate-950/40 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                        {ev.source.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono font-semibold text-slate-100">
                        {ev.value} {ev.unit || ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Constraints Verified */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Mathematical Constraints Checked</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDecision.constraints_checked?.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                      <ShieldCheck className="w-3 h-3 text-teal-400" />
                      {c.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Expected Impact */}
              {selectedDecision.expected_impact && (
                <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 space-y-1 text-xs">
                  <span className="font-semibold text-blue-400 block">Estimated Business Impact</span>
                  {selectedDecision.expected_impact.gross_profit_impact_inr && (
                    <p className="text-slate-300">
                      Gross Profit Impact: <span className="text-white font-mono font-bold">₹{selectedDecision.expected_impact.gross_profit_impact_inr.toLocaleString()}</span>
                    </p>
                  )}
                  <p className="text-slate-400 text-[11px]">
                    Lost Sales Risk: <span className="text-emerald-400">{selectedDecision.expected_impact.lost_sales_risk}</span>
                  </p>
                </div>
              )}

              {/* Agent Provenance */}
              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex justify-between">
                <span>Solver: HiGHS MILP</span>
                <span>Audit Status: Verifiable</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-500 text-xs">
              Select a decision to inspect evidence and reasoning.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
