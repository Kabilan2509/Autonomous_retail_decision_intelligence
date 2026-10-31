import { create } from 'zustand'

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Layer 1: Cities (3) ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const CITIES = [
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.0827,
    lng: 80.2707,
    weather: '35°C Heatwave',
    weather_alert: 'IMD Red Alert — Severe heat index, UV 11+',
    store_count: 7,
    timezone: 'IST',
  },
  {
    id: 'bangalore',
    name: 'Bangalore',
    state: 'Karnataka',
    lat: 12.9716,
    lng: 77.5946,
    weather: '24°C Clear',
    weather_alert: null,
    store_count: 8,
    timezone: 'IST',
  },
  {
    id: 'coimbatore',
    name: 'Coimbatore',
    state: 'Tamil Nadu',
    lat: 11.0168,
    lng: 76.9558,
    weather: '22°C Clear',
    weather_alert: null,
    store_count: 5,
    timezone: 'IST',
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Layer 2: Warehouses (3, one per city) ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const WAREHOUSES = [
  {
    warehouse_id: 'WH-CHN',
    city_id: 'chennai',
    // backward-compat
    store_id: 'S1',
    store_name: 'Chennai',
    location: 'Guindy Industrial Estate, Chennai',
    capacity_units: 50000,
    utilisation_pct: 74,
    inventory: [
      { sku: 'Cola 12-pk',      stock_level: 3800, date_arrived: '2026-10-20T06:00:00Z', sales_velocity: 'High'    },
      { sku: 'SPF50 Sunscreen', stock_level:  240, date_arrived: '2026-10-15T08:30:00Z', sales_velocity: 'High'    },
      { sku: 'Umbrellas',       stock_level: 1200, date_arrived: '2026-10-18T10:00:00Z', sales_velocity: 'Low'     },
      { sku: 'Potato Chips',    stock_level: 5800, date_arrived: '2026-10-22T07:00:00Z', sales_velocity: 'Medium'  },
      { sku: 'Festival Sweets', stock_level:  900, date_arrived: '2026-10-25T09:00:00Z', sales_velocity: 'Medium'  },
    ],
  },
  {
    warehouse_id: 'WH-BLR',
    city_id: 'bangalore',
    store_id: 'S4',
    store_name: 'Bangalore',
    location: 'Peenya Industrial Area, Bangalore',
    capacity_units: 60000,
    utilisation_pct: 61,
    inventory: [
      { sku: 'Cola 12-pk',      stock_level: 4200, date_arrived: '2026-10-21T06:00:00Z', sales_velocity: 'Medium'  },
      { sku: 'SPF50 Sunscreen', stock_level: 1800, date_arrived: '2026-10-14T08:00:00Z', sales_velocity: 'Medium'  },
      { sku: 'Umbrellas',       stock_level: 2200, date_arrived: '2026-10-19T09:00:00Z', sales_velocity: 'Low'     },
      { sku: 'Potato Chips',    stock_level: 6500, date_arrived: '2026-10-23T07:30:00Z', sales_velocity: 'Medium'  },
      { sku: 'Festival Sweets', stock_level: 1100, date_arrived: '2026-10-24T10:00:00Z', sales_velocity: 'Medium'  },
    ],
  },
  {
    warehouse_id: 'WH-CBE',
    city_id: 'coimbatore',
    store_id: 'S2',
    store_name: 'Coimbatore',
    location: 'SIPCOT Industrial Area, Coimbatore',
    capacity_units: 35000,
    utilisation_pct: 83,
    inventory: [
      { sku: 'Cola 12-pk',      stock_level: 2100, date_arrived: '2026-09-28T06:00:00Z', sales_velocity: 'Low'     },
      { sku: 'SPF50 Sunscreen', stock_level: 6200, date_arrived: '2026-10-01T08:00:00Z', sales_velocity: 'Stagnant'},
      { sku: 'Umbrellas',       stock_level:  850, date_arrived: '2026-10-17T09:00:00Z', sales_velocity: 'Low'     },
      { sku: 'Potato Chips',    stock_level: 4300, date_arrived: '2026-10-21T07:30:00Z', sales_velocity: 'Medium'  },
      { sku: 'Festival Sweets', stock_level: 1500, date_arrived: '2026-10-24T10:00:00Z', sales_velocity: 'Low'     },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Layer 3: Stores (20 total) ───────────────────────────────────────────────
//     Chennai: 7 stores  ·  Bangalore: 8 stores  ·  Coimbatore: 5 stores
// ═══════════════════════════════════════════════════════════════════════════════

const mkSku = (sku, stock_level, date_arrived, sales_velocity) =>
  ({ sku, stock_level, date_arrived, sales_velocity })

const STORES = [
  // ── Bangalore (8 stores: ST001 - ST008) ──────────────────────────────────
  {
    id: 'ST001',
    store_id: 'ST001',
    city_id: 'bangalore',
    name: 'BAN Retail 1',
    area: 'Whitefield',
    neighborhood: 'Whitefield',
    location: 'Bangalore',
    address: 'ITPL Main Road, Whitefield, Bengaluru – 560066',
    store_type: 'Urban',
    capacity_units: 8528,
    shelf_capacity_units: 5810,
    latitude: 12.97072,
    longitude: 77.62923,
    daily_revenue: 57410,
    inventory: []
  },
  {
    id: 'ST002',
    store_id: 'ST002',
    city_id: 'bangalore',
    name: 'BAN Retail 2',
    area: 'Electronic City',
    neighborhood: 'Electronic City',
    location: 'Bangalore',
    address: 'Hosur Road, Electronic City Phase 1, Bengaluru – 560100',
    store_type: 'Residential',
    capacity_units: 6419,
    shelf_capacity_units: 4544,
    latitude: 12.95964,
    longitude: 77.64193,
    daily_revenue: 54620,
    inventory: []
  },
  {
    id: 'ST003',
    store_id: 'ST003',
    city_id: 'bangalore',
    name: 'BAN Retail 3',
    area: 'Indiranagar',
    neighborhood: 'Indiranagar',
    location: 'Bangalore',
    address: '100 Feet Road, Indiranagar, Bengaluru – 560038',
    store_type: 'Commercial',
    capacity_units: 7800,
    shelf_capacity_units: 5788,
    latitude: 12.92398,
    longitude: 77.63155,
    daily_revenue: 42600,
    inventory: []
  },
  {
    id: 'ST004',
    store_id: 'ST004',
    city_id: 'bangalore',
    name: 'BAN Retail 4',
    area: 'Jayanagar',
    neighborhood: 'Jayanagar',
    location: 'Bangalore',
    address: '11th Main, Jayanagar 4th Block, Bengaluru – 560041',
    store_type: 'Transit',
    capacity_units: 7837,
    shelf_capacity_units: 4562,
    latitude: 12.93478,
    longitude: 77.51189,
    daily_revenue: 61300,
    inventory: []
  },
  {
    id: 'ST005',
    store_id: 'ST005',
    city_id: 'bangalore',
    name: 'BAN Retail 5',
    area: 'Yelahanka',
    neighborhood: 'Yelahanka',
    location: 'Bangalore',
    address: 'BB Road, Yelahanka New Town, Bengaluru – 560064',
    store_type: 'Mixed',
    capacity_units: 5738,
    shelf_capacity_units: 3175,
    latitude: 12.99536,
    longitude: 77.51734,
    daily_revenue: 54270,
    inventory: []
  },
  {
    id: 'ST006',
    store_id: 'ST006',
    city_id: 'bangalore',
    name: 'BAN Retail 6',
    area: 'Koramangala',
    neighborhood: 'Koramangala',
    location: 'Bangalore',
    address: '80 Feet Road, Koramangala 4th Block, Bengaluru – 560034',
    store_type: 'Urban',
    capacity_units: 5651,
    shelf_capacity_units: 3162,
    latitude: 12.96165,
    longitude: 77.61914,
    daily_revenue: 38630,
    inventory: []
  },
  {
    id: 'ST007',
    store_id: 'ST007',
    city_id: 'bangalore',
    name: 'BAN Retail 7',
    area: 'Hebbal',
    neighborhood: 'Hebbal',
    location: 'Bangalore',
    address: 'Bellary Road, Hebbal, Bengaluru – 560024',
    store_type: 'Residential',
    capacity_units: 6146,
    shelf_capacity_units: 4523,
    latitude: 13.00886,
    longitude: 77.62437,
    daily_revenue: 46030,
    inventory: []
  },
  {
    id: 'ST008',
    store_id: 'ST008',
    city_id: 'bangalore',
    name: 'BAN Retail 8',
    area: 'Malleshwaram',
    neighborhood: 'Malleshwaram',
    location: 'Bangalore',
    address: 'Margosa Road, Malleshwaram, Bengaluru – 560003',
    store_type: 'Commercial',
    capacity_units: 7273,
    shelf_capacity_units: 4674,
    latitude: 12.97176,
    longitude: 77.63499,
    daily_revenue: 52490,
    inventory: []
  },

  // ── Chennai (7 stores: ST009 - ST015) ────────────────────────────────────
  {
    id: 'ST009',
    store_id: 'ST009',
    city_id: 'chennai',
    name: 'CHE Retail 1',
    area: 'Anna Nagar',
    neighborhood: 'Anna Nagar',
    location: 'Chennai',
    address: '2nd Avenue, Anna Nagar, Chennai – 600040',
    store_type: 'Urban',
    capacity_units: 8880,
    shelf_capacity_units: 4884,
    latitude: 13.1692,
    longitude: 80.28876,
    daily_revenue: 36000,
    inventory: []
  },
  {
    id: 'ST010',
    store_id: 'ST010',
    city_id: 'chennai',
    name: 'CHE Retail 2',
    area: 'Velachery',
    neighborhood: 'Velachery',
    location: 'Chennai',
    address: 'Velachery Main Road, Chennai – 600042',
    store_type: 'Residential',
    capacity_units: 5916,
    shelf_capacity_units: 4155,
    latitude: 13.07487,
    longitude: 80.25736,
    daily_revenue: 38690,
    inventory: []
  },
  {
    id: 'ST011',
    store_id: 'ST011',
    city_id: 'chennai',
    name: 'CHE Retail 3',
    area: 'T. Nagar',
    neighborhood: 'T. Nagar',
    location: 'Chennai',
    address: 'Pondy Bazaar, T. Nagar, Chennai – 600017',
    store_type: 'Commercial',
    capacity_units: 7922,
    shelf_capacity_units: 6097,
    latitude: 13.08732,
    longitude: 80.32997,
    daily_revenue: 31460,
    inventory: []
  },
  {
    id: 'ST012',
    store_id: 'ST012',
    city_id: 'chennai',
    name: 'CHE Retail 4',
    area: 'Tambaram',
    neighborhood: 'Tambaram',
    location: 'Chennai',
    address: 'GST Road, Tambaram, Chennai – 600045',
    store_type: 'Transit',
    capacity_units: 5201,
    shelf_capacity_units: 3103,
    latitude: 13.1166,
    longitude: 80.26859,
    daily_revenue: 26470,
    inventory: []
  },
  {
    id: 'ST013',
    store_id: 'ST013',
    city_id: 'chennai',
    name: 'CHE Retail 5',
    area: 'OMR',
    neighborhood: 'OMR',
    location: 'Chennai',
    address: 'Rajiv Gandhi Salai, OMR, Chennai – 600096',
    store_type: 'Mixed',
    capacity_units: 8917,
    shelf_capacity_units: 5450,
    latitude: 13.13117,
    longitude: 80.29583,
    daily_revenue: 34070,
    inventory: []
  },
  {
    id: 'ST014',
    store_id: 'ST014',
    city_id: 'chennai',
    name: 'CHE Retail 6',
    area: 'Adyar',
    neighborhood: 'Adyar',
    location: 'Chennai',
    address: 'Lattice Bridge Road, Adyar, Chennai – 600020',
    store_type: 'Urban',
    capacity_units: 5570,
    shelf_capacity_units: 3977,
    latitude: 13.10681,
    longitude: 80.24573,
    daily_revenue: 52120,
    inventory: []
  },
  {
    id: 'ST015',
    store_id: 'ST015',
    city_id: 'chennai',
    name: 'CHE Retail 7',
    area: 'Porur',
    neighborhood: 'Porur',
    location: 'Chennai',
    address: 'Mount-Poonamallee Road, Porur, Chennai – 600116',
    store_type: 'Residential',
    capacity_units: 6247,
    shelf_capacity_units: 4295,
    latitude: 13.19563,
    longitude: 80.22918,
    daily_revenue: 60420,
    inventory: []
  },

  // ── Coimbatore (5 stores: ST016 - ST020) ──────────────────────────────────
  {
    id: 'ST016',
    store_id: 'ST016',
    city_id: 'coimbatore',
    name: 'COI Retail 1',
    area: 'Gandhipuram',
    neighborhood: 'Gandhipuram',
    location: 'Coimbatore',
    address: 'Cross Cut Road, Gandhipuram, Coimbatore – 641012',
    store_type: 'Urban',
    capacity_units: 5918,
    shelf_capacity_units: 3691,
    latitude: 11.01161,
    longitude: 76.91885,
    daily_revenue: 40240,
    inventory: []
  },
  {
    id: 'ST017',
    store_id: 'ST017',
    city_id: 'coimbatore',
    name: 'COI Retail 2',
    area: 'Peelamedu',
    neighborhood: 'Peelamedu',
    location: 'Coimbatore',
    address: 'Avinashi Road, Peelamedu, Coimbatore – 641004',
    store_type: 'Residential',
    capacity_units: 6175,
    shelf_capacity_units: 3595,
    latitude: 11.06164,
    longitude: 76.96817,
    daily_revenue: 61170,
    inventory: []
  },
  {
    id: 'ST018',
    store_id: 'ST018',
    city_id: 'coimbatore',
    name: 'COI Retail 3',
    area: 'RS Puram',
    neighborhood: 'RS Puram',
    location: 'Coimbatore',
    address: 'DB Road, RS Puram, Coimbatore – 641002',
    store_type: 'Commercial',
    capacity_units: 6554,
    shelf_capacity_units: 4420,
    latitude: 11.05909,
    longitude: 76.94195,
    daily_revenue: 33900,
    inventory: []
  },
  {
    id: 'ST019',
    store_id: 'ST019',
    city_id: 'coimbatore',
    name: 'COI Retail 4',
    area: 'Saravanampatti',
    neighborhood: 'Saravanampatti',
    location: 'Coimbatore',
    address: 'Sathy Road, Saravanampatti, Coimbatore – 641035',
    store_type: 'Transit',
    capacity_units: 8560,
    shelf_capacity_units: 6512,
    latitude: 11.02706,
    longitude: 76.89558,
    daily_revenue: 59780,
    inventory: []
  },
  {
    id: 'ST020',
    store_id: 'ST020',
    city_id: 'coimbatore',
    name: 'COI Retail 5',
    area: 'Town Hall',
    neighborhood: 'Town Hall',
    location: 'Coimbatore',
    address: 'Big Bazaar Street, Town Hall, Coimbatore – 641001',
    store_type: 'Mixed',
    capacity_units: 7989,
    shelf_capacity_units: 5039,
    latitude: 11.05447,
    longitude: 76.96193,
    daily_revenue: 60610,
    inventory: []
  }
];

const AI_DECISIONS = [
  {
    decision_id: 'REC-001',
    type: 'INTRA_CITY_TRANSFER',
    // ── Hierarchical routing ──
    city_id: 'chennai',
    source_store_id: 'chennai_store_2',
    destination_store_id: 'chennai_store_7',
    // ── Backward-compat display fields ──
    source: 'Chennai',
    destination: 'Chennai',
    source_label: 'Chennai Store 2 (T. Nagar)',
    destination_label: 'Chennai Store 7 (Tambaram)',
    sku: 'SPF50 Sunscreen',
    quantity: 120,
    rationale:
      'Chennai Store 2 (T. Nagar) holds 280 units of SPF50 Sunscreen with Stagnant velocity — surplus accumulated from an over-ordered batch. Store 7 (Tambaram) is critically low at 18 units with High velocity driven by the 35°C heatwave. Intra-city transfer is same-day (45 min, 28 km), eliminates stockout risk, and avoids external procurement cost.',
    expected_margin_impact: '+$840',
    confidence: 96,
    status: 'PENDING',
    created_at: '2026-10-31T04:00:00Z',
  },
  {
    decision_id: 'REC-002',
    type: 'WAREHOUSE_REPLENISHMENT',
    // ── Hierarchical routing ──
    city_id: 'bangalore',
    source_store_id: null,
    destination_store_id: 'bangalore_store_5',
    // ── Backward-compat display fields ──
    source: 'Bangalore',
    destination: 'Bangalore',
    source_label: 'Bangalore Warehouse (Peenya)',
    destination_label: 'Bangalore Store 5 (Jayanagar)',
    sku: 'Potato Chips',
    quantity: 400,
    rationale:
      'Bangalore Store 5 (Jayanagar) has only 22 units of Potato Chips remaining with High sales velocity — approximately 1.5 days of stock left. Bangalore Warehouse holds 6,500 units at 61% utilisation. Immediate warehouse-to-store replenishment of 400 units will prevent a 36-hour stockout and protect ₹41,000 in projected weekly revenue.',
    expected_margin_impact: '+$1,640',
    confidence: 98,
    status: 'PENDING',
    created_at: '2026-10-31T04:10:00Z',
  },
  {
    decision_id: 'REC-003',
    type: 'INVENTORY_TRANSFER',
    // ── Hierarchical routing ──
    city_id: null,
    source_store_id: 'coimbatore_store_1',
    destination_store_id: 'chennai_store_5',
    // ── Backward-compat display fields ──
    source: 'Coimbatore',
    destination: 'Chennai',
    source_label: 'Coimbatore Store 1 (RS Puram)',
    destination_label: 'Chennai Store 5 (OMR)',
    sku: 'SPF50 Sunscreen',
    quantity: 200,
    rationale:
      'Coimbatore Store 1 holds 380 units of SPF50 Sunscreen — stagnant overstock at 22°C with near-zero sell-through. Chennai Store 5 (OMR) is critically low at 43 units with High velocity due to the 35°C heatwave. Inter-city transfer (6h 30m, 495 km) prevents stockout across the Chennai OMR tech corridor and clears dead inventory from Coimbatore.',
    expected_margin_impact: '+$1,200',
    confidence: 94,
    status: 'PENDING',
    created_at: '2026-10-31T04:20:00Z',
  },
  {
    decision_id: 'REC-004',
    type: 'MARKDOWN',
    // ── Hierarchical routing ──
    city_id: 'coimbatore',
    source_store_id: 'coimbatore_store_2',
    destination_store_id: null,
    // ── Backward-compat display fields ──
    source: 'Coimbatore',
    destination: null,
    source_label: 'Coimbatore Store 2 (Gandhipuram)',
    destination_label: null,
    sku: 'Cola 12-pk',
    quantity: 210,
    rationale:
      'Cola 12-pk batch (arrived 2026-09-28) at Coimbatore Store 2 is 33 days old and within the 45-day expiry window. Current sales velocity is Low. A 20% markdown will accelerate sell-through and recover an estimated $840 versus a total write-off loss of $1,050. No viable transfer destination — Bangalore and Chennai stores are well-stocked.',
    expected_margin_impact: '-$210 (vs. -$1,050 write-off)',
    confidence: 89,
    status: 'PENDING',
    created_at: '2026-10-31T04:35:00Z',
  },
  {
    decision_id: 'REC-005',
    type: 'RESTOCK_ALERT',
    // ── Hierarchical routing ──
    city_id: 'chennai',
    source_store_id: null,
    destination_store_id: 'chennai_store_4',
    // ── Backward-compat display fields ──
    source: null,
    destination: 'Chennai',
    source_label: null,
    destination_label: 'Chennai Store 4 (Adyar)',
    sku: 'Festival Sweets',
    quantity: 500,
    rationale:
      'Karthigai Deepam festival (Nov 15) is 15 days away. Chennai Store 4 (Adyar) holds only 63 units of Festival Sweets with High velocity — approximately 4 days of stock. Historical data across the Chennai network shows an 11× demand surge during this festival. Restock of 500 units from Chennai Warehouse (900 units on hand) is recommended immediately to avoid a critical stockout at peak demand.',
    expected_margin_impact: '+$3,800',
    confidence: 95,
    status: 'PENDING',
    created_at: '2026-10-31T04:50:00Z',
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Zustand Store ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const useStore = create((set, get) => ({

  // ── Hierarchical State ───────────────────────────────────────────────────────

  /** The active city ID (drill-down level 1) */
  activeCity: 'bangalore',

  /** The active store ID within the city, or 'all' for city-level view */
  activeStore: 'all',

  /** Full cities list */
  cities: CITIES,

  /** Full warehouses list */
  warehouses: WAREHOUSES,

  /** Full stores list (all 20) */
  stores: STORES,

  /** AI decisions */
  ai_decisions: AI_DECISIONS,

  // ── Backward-Compat String Shim ──────────────────────────────────────────────
  // `currentStore` is the active city NAME as a plain string so existing pages
  // using `useAppStore((s) => s.currentStore)` continue to work unchanged.
  currentStore: 'Bangalore',

  // ── Hierarchical Selectors ───────────────────────────────────────────────────

  /** Get a city object by id */
  getCity: (cityId) => {
    const id = cityId ?? get().activeCity
    return get().cities.find((c) => c.id === id) ?? get().cities[0]
  },

  /** Get all stores belonging to the active (or specified) city */
  getStoresForCity: (cityId) => {
    const id = cityId ?? get().activeCity
    return get().stores.filter((s) => s.city_id === id)
  },

  /** Get a single store by id */
  getStore: (storeId) => {
    const id = storeId ?? get().activeStore
    return get().stores.find((s) => s.id === id) ?? null
  },

  /** Get the warehouse for the active (or specified) city */
  getWarehouseForCity: (cityId) => {
    const id = cityId ?? get().activeCity
    return get().warehouses.find((w) => w.city_id === id) ?? get().warehouses[0]
  },

  /** AI decisions scoped to a city */
  getDecisionsForCity: (cityId) => {
    const id = cityId ?? get().activeCity
    const city = CITIES.find((c) => c.id === id)
    if (!city) return []
    return get().ai_decisions.filter(
      (d) => d.source === city.name || d.destination === city.name,
    )
  },

  /** AI decisions scoped to a specific store */
  getDecisionsForStoreId: (storeId) => {
    const id = storeId ?? get().activeStore
    return get().ai_decisions.filter(
      (d) => d.source_store_id === id || d.destination_store_id === id,
    )
  },

  // ── Backward-Compat Selectors ────────────────────────────────────────────────
  // These match the exact function signatures used by existing pages.

  /** Returns the city object for the currently active city (was: getCurrentStoreData) */
  getCurrentStoreData: () => {
    const { cities, activeCity } = get()
    return cities.find((c) => c.id === activeCity) ?? cities[0]
  },

  /** Returns the warehouse for the currently active city */
  getCurrentWarehouse: () => {
    const { warehouses, activeCity } = get()
    return warehouses.find((w) => w.city_id === activeCity) ?? warehouses[0]
  },

  /** Returns AI decisions relevant to the active city (or a given city name) */
  getDecisionsForStore: (cityName) => {
    const { ai_decisions, activeCity, cities } = get()
    const name =
      cityName ?? cities.find((c) => c.id === activeCity)?.name ?? 'Chennai'
    return ai_decisions.filter(
      (d) => d.source === name || d.destination === name,
    )
  },

  // ── Actions ──────────────────────────────────────────────────────────────────

  /** Switch the active city by id */
  setActiveCity: (cityId) => {
    const city = CITIES.find((c) => c.id === cityId)
    set({ activeCity: cityId, activeStore: 'all', currentStore: city?.name ?? 'Chennai' })
  },

  /** Switch the active store within the current city */
  setActiveStore: (storeId) => set({ activeStore: storeId }),

  /**
   * Backward-compat: accepts a city NAME (string) and maps it to setActiveCity.
   * Used by TopHeader store-switcher and any existing page calling setCurrentStore.
   */
  setCurrentStore: (cityName) => {
    const city = CITIES.find(
      (c) => c.name.toLowerCase() === cityName.toLowerCase(),
    )
    if (city) set({ activeCity: city.id, activeStore: 'all', currentStore: city.name })
  },

  /** Update a decision's status (PENDING → APPROVED / REJECTED / MODIFIED) */
  updateDecisionStatus: (decisionId, status) =>
    set((state) => ({
      ai_decisions: state.ai_decisions.map((d) =>
        d.decision_id === decisionId ? { ...d, status } : d,
      ),
    })),

  /** Execute a store-to-store transfer — adjusts inventory on both sides */
  executeTransfer: ({ fromStoreId, toStoreId, sku, quantity }) =>
    set((state) => ({
      stores: state.stores.map((s) => {
        if (s.id === fromStoreId) {
          return {
            ...s,
            inventory: s.inventory.map((item) =>
              item.sku === sku
                ? { ...item, stock_level: Math.max(0, item.stock_level - quantity) }
                : item,
            ),
          }
        }
        if (s.id === toStoreId) {
          return {
            ...s,
            inventory: s.inventory.map((item) =>
              item.sku === sku
                ? { ...item, stock_level: item.stock_level + quantity }
                : item,
            ),
          }
        }
        return s
      }),
    })),
}))

export default useStore
