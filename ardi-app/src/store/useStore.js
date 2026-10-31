import { create } from 'zustand'

// ─── Mock AI Dataset ──────────────────────────────────────────────────────────

const STORES = [
  { id: 'S1', name: 'Chennai',     lat: 13.0827, lng: 80.2707, weather: '35°C Heatwave' },
  { id: 'S2', name: 'Coimbatore', lat: 11.0168, lng: 76.9558, weather: '22°C Clear' },
  { id: 'S3', name: 'Palani',     lat: 10.4500, lng: 77.5167, weather: '28°C Expected Rain' },
]

const WAREHOUSES = [
  {
    warehouse_id: 'WH-S1',
    store_id: 'S1',
    store_name: 'Chennai',
    location: 'Guindy Industrial Estate, Chennai',
    inventory: [
      {
        sku: 'Cola 12-pk',
        stock_level: 340,
        date_arrived: '2026-10-20T06:00:00Z',
        sales_velocity: 'High',
      },
      {
        sku: 'SPF50 Sunscreen',
        // Low stock + high demand due to 35°C heatwave
        stock_level: 18,
        date_arrived: '2026-10-15T08:30:00Z',
        sales_velocity: 'High',
      },
      {
        sku: 'Umbrellas',
        stock_level: 120,
        date_arrived: '2026-10-18T10:00:00Z',
        sales_velocity: 'Low',
      },
      {
        sku: 'Potato Chips',
        stock_level: 580,
        date_arrived: '2026-10-22T07:00:00Z',
        sales_velocity: 'Medium',
      },
      {
        sku: 'Festival Sweets',
        stock_level: 90,
        date_arrived: '2026-10-25T09:00:00Z',
        sales_velocity: 'Medium',
      },
    ],
  },
  {
    warehouse_id: 'WH-S2',
    store_id: 'S2',
    store_name: 'Coimbatore',
    location: 'SIPCOT Industrial Area, Coimbatore',
    inventory: [
      {
        sku: 'Cola 12-pk',
        // Nearing expiry — candidate for MARKDOWN
        stock_level: 210,
        date_arrived: '2026-09-28T06:00:00Z',
        sales_velocity: 'Low',
      },
      {
        sku: 'SPF50 Sunscreen',
        // Excess overstock — stagnant due to cooler 22°C weather
        stock_level: 620,
        date_arrived: '2026-10-01T08:00:00Z',
        sales_velocity: 'Stagnant',
      },
      {
        sku: 'Umbrellas',
        stock_level: 85,
        date_arrived: '2026-10-17T09:00:00Z',
        sales_velocity: 'Low',
      },
      {
        sku: 'Potato Chips',
        stock_level: 430,
        date_arrived: '2026-10-21T07:30:00Z',
        sales_velocity: 'Medium',
      },
      {
        sku: 'Festival Sweets',
        stock_level: 150,
        date_arrived: '2026-10-24T10:00:00Z',
        sales_velocity: 'Low',
      },
    ],
  },
  {
    warehouse_id: 'WH-S3',
    store_id: 'S3',
    store_name: 'Palani',
    location: 'Palani Hill Industrial Zone, Dindigul',
    inventory: [
      {
        sku: 'Cola 12-pk',
        stock_level: 180,
        date_arrived: '2026-10-19T06:00:00Z',
        sales_velocity: 'Medium',
      },
      {
        sku: 'SPF50 Sunscreen',
        stock_level: 95,
        date_arrived: '2026-10-16T08:00:00Z',
        sales_velocity: 'Medium',
      },
      {
        sku: 'Umbrellas',
        // Rain expected — elevated demand
        stock_level: 240,
        date_arrived: '2026-10-20T09:00:00Z',
        sales_velocity: 'High',
      },
      {
        sku: 'Potato Chips',
        stock_level: 320,
        date_arrived: '2026-10-23T07:00:00Z',
        sales_velocity: 'Medium',
      },
      {
        sku: 'Festival Sweets',
        // Upcoming Karthigai Deepam festival — critically low stock
        stock_level: 45,
        date_arrived: '2026-10-26T09:00:00Z',
        sales_velocity: 'High',
      },
    ],
  },
]

const AI_DECISIONS = [
  {
    decision_id: 'REC-001',
    type: 'INVENTORY_TRANSFER',
    source: 'Coimbatore',
    destination: 'Chennai',
    sku: 'SPF50 Sunscreen',
    quantity: 200,
    rationale:
      'Chennai experiencing 35°C heatwave causing 400% demand spike. Coimbatore has stagnant overstock of 620 units with near-zero sell-through at 22°C. Immediate transfer prevents stockout in Chennai and clears dead inventory in Coimbatore.',
    expected_margin_impact: '+$1,200',
    confidence: 97,
    status: 'PENDING',
    created_at: '2026-10-31T04:00:00Z',
  },
  {
    decision_id: 'REC-002',
    type: 'MARKDOWN',
    source: 'Coimbatore',
    destination: null,
    sku: 'Cola 12-pk',
    quantity: 210,
    rationale:
      'Cola 12-pk batch (arrived 2026-09-28) in Coimbatore is 33 days old and approaching 45-day expiry window. Current sales velocity is Low. A 20% markdown will accelerate sell-through and recover $840 vs. a total write-off loss of $1,050.',
    expected_margin_impact: '-$210 (vs. -$1,050 write-off)',
    confidence: 89,
    status: 'PENDING',
    created_at: '2026-10-31T04:15:00Z',
  },
  {
    decision_id: 'REC-003',
    type: 'RESTOCK_ALERT',
    source: null,
    destination: 'Palani',
    sku: 'Festival Sweets',
    quantity: 500,
    rationale:
      'Karthigai Deepam festival (Nov 15) is 15 days away. Palani, a major pilgrimage hub, currently holds only 45 units with High sales velocity. Historical data shows 11× demand surge during this festival. Immediate restock of 500 units recommended to avoid critical stockout at peak demand.',
    expected_margin_impact: '+$3,800',
    confidence: 94,
    status: 'PENDING',
    created_at: '2026-10-31T04:30:00Z',
  },
]

// ─── Zustand Store ────────────────────────────────────────────────────────────

const useStore = create((set, get) => ({
  // ── State ──
  currentStore: 'Chennai',
  stores: STORES,
  warehouses: WAREHOUSES,
  ai_decisions: AI_DECISIONS,

  // ── Derived helpers (computed via get()) ──

  /** Returns the full store object for the currently selected store */
  getCurrentStoreData: () => {
    const { stores, currentStore } = get()
    return stores.find((s) => s.name === currentStore) ?? stores[0]
  },

  /** Returns the warehouse object for the currently selected store */
  getCurrentWarehouse: () => {
    const { warehouses, currentStore } = get()
    return warehouses.find((w) => w.store_name === currentStore) ?? warehouses[0]
  },

  /** Returns AI decisions filtered/relevant to current store */
  getDecisionsForStore: (storeName) => {
    const { ai_decisions } = get()
    const name = storeName ?? get().currentStore
    return ai_decisions.filter(
      (d) => d.source === name || d.destination === name,
    )
  },

  // ── Actions ──

  /** Switch the active store by name */
  setCurrentStore: (storeName) => set({ currentStore: storeName }),

  /** Update a decision's status (e.g. PENDING → APPROVED / REJECTED) */
  updateDecisionStatus: (decisionId, status) =>
    set((state) => ({
      ai_decisions: state.ai_decisions.map((d) =>
        d.decision_id === decisionId ? { ...d, status } : d,
      ),
    })),
}))

export default useStore
