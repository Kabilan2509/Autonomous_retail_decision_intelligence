/**
 * ARDI Backend API Client
 * Connects the React application to the FastAPI autonomous intelligence engine.
 */
const BASE_URL = 'http://localhost:8000/api/v1'

export async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    })
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`)
    }
    return await res.json()
  } catch (err) {
    console.warn(`[ARDI API] Fetch failed for ${endpoint}:`, err.message)
    throw err
  }
}

// ─── Domain Services ─────────────────────────────────────────────────────────

export const api = {
  // Dashboard
  getDashboardSummary: () => fetchApi('/dashboard/summary'),
  getStores: () => fetchApi('/dashboard/stores'),
  getAgentsStatus: () => fetchApi('/dashboard/agents/status'),

  // Demand Forecasts
  getForecast: (storeId, skuId, horizon = 7) => 
    fetchApi(`/forecasts/predict/${storeId}/${skuId}?horizon_days=${horizon}`),
  getBatchForecasts: (storeId, limit = 20) =>
    fetchApi(`/forecasts/batch?store_id=${storeId || ''}&limit=${limit}`),

  // Inventory Intelligence
  getInventorySnapshot: (storeId, category, limit = 50) =>
    fetchApi(`/inventory/snapshot?limit=${limit}${storeId ? `&store_id=${storeId}` : ''}${category ? `&category=${category}` : ''}`),
  getInventoryRisks: () => fetchApi('/inventory/risks'),

  // Supplier Intelligence
  getSupplierMetrics: (supplierId) =>
    fetchApi(`/suppliers/metrics${supplierId ? `?supplier_id=${supplierId}` : ''}`),
  getAlternativeSuppliers: (skuId) =>
    fetchApi(`/suppliers/alternative-sources/${skuId}`),

  // Pricing Intelligence
  getPricingAnalysis: (skuId) =>
    fetchApi(`/pricing/analysis${skuId ? `?sku_id=${skuId}` : ''}`),

  // External Signals (News & Weather)
  getNewsSignals: (location) =>
    fetchApi(`/external/news${location ? `?location=${location}` : ''}`),
  getWeatherSignals: (location) =>
    fetchApi(`/external/weather${location ? `?location=${location}` : ''}`),

  // AI Decision Center (CRUD & Approvals)
  getDecisions: (limit = 50, action, status, storeId) => {
    let q = `?limit=${limit}`
    if (storeId) q += `&store_id=${storeId}`
    if (action && action !== 'ALL') q += `&action=${action}`
    if (status && status !== 'ALL') q += `&approval_status=${status}`
    return fetchApi(`/decisions/${q}`)
  },
  generateDecisions: (storeId, limit = 50) =>
    fetchApi(`/decisions/generate?limit=${limit}${storeId ? `&store_id=${storeId}` : ''}`, { method: 'POST' }),
  approveDecision: (decisionId, note = 'Approved by manager') =>
    fetchApi(`/decisions/${decisionId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ approval_status: 'APPROVED', reviewer_note: note })
    }),
  rejectDecision: (decisionId, note = 'Rejected') =>
    fetchApi(`/decisions/${decisionId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ approval_status: 'REJECTED', reviewer_note: note })
    }),
  requestReview: (decisionId, note = 'Need supervisor sign-off') =>
    fetchApi(`/decisions/${decisionId}/request-review`, {
      method: 'PATCH',
      body: JSON.stringify({ approval_status: 'HUMAN_REVIEW', reviewer_note: note })
    }),

  // Logistics & Transshipment (OR-Tools)
  getTransfers: (skuId) =>
    fetchApi(`/logistics/transfers${skuId ? `?sku_id=${skuId}` : ''}`),

  // Simulation Lab & Surprise Scenarios
  getScenarios: () => fetchApi('/scenarios/'),
  runScenario: (scenarioId, overrideParams = {}) =>
    fetchApi('/scenarios/run', {
      method: 'POST',
      body: JSON.stringify({ scenario_id: scenarioId, override_params: overrideParams })
    }),

  // KPI & Baseline Evaluation
  getKPIs: () => fetchApi('/evaluation/kpis'),
  getBaselineComparison: () => fetchApi('/evaluation/baseline-comparison')
}
