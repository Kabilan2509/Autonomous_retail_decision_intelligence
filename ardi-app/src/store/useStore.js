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

  // ── Chennai (7) ─────────────────────────────────────────────────────────────
  {
    id: 'chennai_store_1',
    city_id: 'chennai',
    name: 'Chennai Store 1',
    area: 'Anna Nagar',
    address: 'WA Block, 2nd Ave, Anna Nagar, Chennai – 600040',
    daily_revenue: 42800,
    inventory: [
      mkSku('Cola 12-pk',      312, '2026-10-20T06:00:00Z', 'High'   ),
      mkSku('SPF50 Sunscreen',  54, '2026-10-15T08:30:00Z', 'High'   ),
      mkSku('Umbrellas',        95, '2026-10-18T10:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    480, '2026-10-22T07:00:00Z', 'Medium' ),
      mkSku('Festival Sweets',  72, '2026-10-25T09:00:00Z', 'Medium' ),
    ],
  },
  {
    id: 'chennai_store_2',
    city_id: 'chennai',
    name: 'Chennai Store 2',
    area: 'T. Nagar',
    address: 'Pondy Bazaar, T. Nagar, Chennai – 600017',
    daily_revenue: 51200,
    inventory: [
      mkSku('Cola 12-pk',      278, '2026-10-21T06:00:00Z', 'High'    ),
      // Surplus — candidate for intra-city transfer to Store 7
      mkSku('SPF50 Sunscreen', 280, '2026-10-01T08:00:00Z', 'Stagnant'),
      mkSku('Umbrellas',       110, '2026-10-19T10:00:00Z', 'Low'     ),
      mkSku('Potato Chips',    390, '2026-10-22T07:00:00Z', 'Medium'  ),
      mkSku('Festival Sweets',  88, '2026-10-25T09:00:00Z', 'Medium'  ),
    ],
  },
  {
    id: 'chennai_store_3',
    city_id: 'chennai',
    name: 'Chennai Store 3',
    area: 'Velachery',
    address: 'Velachery Main Road, Velachery, Chennai – 600042',
    daily_revenue: 38600,
    inventory: [
      mkSku('Cola 12-pk',      195, '2026-10-20T06:00:00Z', 'High'   ),
      mkSku('SPF50 Sunscreen',  68, '2026-10-16T08:30:00Z', 'High'   ),
      mkSku('Umbrellas',        80, '2026-10-18T10:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    320, '2026-10-23T07:00:00Z', 'Medium' ),
      mkSku('Festival Sweets',  55, '2026-10-26T09:00:00Z', 'Medium' ),
    ],
  },
  {
    id: 'chennai_store_4',
    city_id: 'chennai',
    name: 'Chennai Store 4',
    area: 'Adyar',
    address: 'Sardar Patel Road, Adyar, Chennai – 600020',
    daily_revenue: 33400,
    inventory: [
      mkSku('Cola 12-pk',      220, '2026-10-21T06:00:00Z', 'High'   ),
      mkSku('SPF50 Sunscreen',  91, '2026-10-15T08:30:00Z', 'High'   ),
      mkSku('Umbrellas',       105, '2026-10-17T10:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    410, '2026-10-22T07:00:00Z', 'Medium' ),
      mkSku('Festival Sweets',  63, '2026-10-25T09:00:00Z', 'High'   ),
    ],
  },
  {
    id: 'chennai_store_5',
    city_id: 'chennai',
    name: 'Chennai Store 5',
    area: 'OMR',
    address: 'Old Mahabalipuram Road, Sholinganallur, Chennai – 600119',
    daily_revenue: 47100,
    inventory: [
      mkSku('Cola 12-pk',      188, '2026-10-20T06:00:00Z', 'High'   ),
      mkSku('SPF50 Sunscreen',  43, '2026-10-14T08:30:00Z', 'High'   ),
      mkSku('Umbrellas',        72, '2026-10-18T10:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    350, '2026-10-22T07:00:00Z', 'Medium' ),
      mkSku('Festival Sweets',  47, '2026-10-26T09:00:00Z', 'Medium' ),
    ],
  },
  {
    id: 'chennai_store_6',
    city_id: 'chennai',
    name: 'Chennai Store 6',
    area: 'Porur',
    address: 'Mount Poonamalle Road, Porur, Chennai – 600116',
    daily_revenue: 29800,
    inventory: [
      mkSku('Cola 12-pk',      145, '2026-10-21T06:00:00Z', 'Medium' ),
      mkSku('SPF50 Sunscreen',  77, '2026-10-16T08:30:00Z', 'High'   ),
      mkSku('Umbrellas',        88, '2026-10-19T10:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    265, '2026-10-23T07:00:00Z', 'Medium' ),
      mkSku('Festival Sweets',  40, '2026-10-25T09:00:00Z', 'Medium' ),
    ],
  },
  {
    id: 'chennai_store_7',
    city_id: 'chennai',
    name: 'Chennai Store 7',
    area: 'Tambaram',
    address: 'GST Road, Tambaram, Chennai – 600045',
    daily_revenue: 24500,
    inventory: [
      mkSku('Cola 12-pk',      166, '2026-10-20T06:00:00Z', 'High'   ),
      // Critically low — receives intra-city transfer from Store 2
      mkSku('SPF50 Sunscreen',  18, '2026-10-12T08:30:00Z', 'High'   ),
      mkSku('Umbrellas',        60, '2026-10-18T10:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    200, '2026-10-22T07:00:00Z', 'Medium' ),
      mkSku('Festival Sweets',  35, '2026-10-25T09:00:00Z', 'Medium' ),
    ],
  },

  // ── Bangalore (8) ───────────────────────────────────────────────────────────
  {
    id: 'bangalore_store_1',
    city_id: 'bangalore',
    name: 'Bangalore Store 1',
    area: 'Koramangala',
    address: '80 Feet Road, Koramangala 4th Block, Bengaluru – 560034',
    daily_revenue: 55400,
    inventory: [
      mkSku('Cola 12-pk',      285, '2026-10-21T06:00:00Z', 'Medium' ),
      mkSku('SPF50 Sunscreen', 130, '2026-10-15T08:30:00Z', 'Medium' ),
      mkSku('Umbrellas',       200, '2026-10-18T10:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    420, '2026-10-22T07:00:00Z', 'Medium' ),
      mkSku('Festival Sweets',  95, '2026-10-25T09:00:00Z', 'Medium' ),
    ],
  },
  {
    id: 'bangalore_store_2',
    city_id: 'bangalore',
    name: 'Bangalore Store 2',
    area: 'Indiranagar',
    address: '100 Feet Road, Indiranagar, Bengaluru – 560038',
    daily_revenue: 61800,
    inventory: [
      mkSku('Cola 12-pk',      310, '2026-10-20T06:00:00Z', 'Medium' ),
      mkSku('SPF50 Sunscreen', 155, '2026-10-14T08:30:00Z', 'Medium' ),
      mkSku('Umbrellas',       180, '2026-10-17T10:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    465, '2026-10-23T07:00:00Z', 'Medium' ),
      mkSku('Festival Sweets', 108, '2026-10-26T09:00:00Z', 'Medium' ),
    ],
  },
  {
    id: 'bangalore_store_3',
    city_id: 'bangalore',
    name: 'Bangalore Store 3',
    area: 'Whitefield',
    address: 'ITPL Main Road, Whitefield, Bengaluru – 560066',
    daily_revenue: 49200,
    inventory: [
      mkSku('Cola 12-pk',      260, '2026-10-21T06:00:00Z', 'Medium' ),
      mkSku('SPF50 Sunscreen', 118, '2026-10-15T08:30:00Z', 'Medium' ),
      mkSku('Umbrellas',       165, '2026-10-19T10:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    395, '2026-10-22T07:00:00Z', 'Medium' ),
      mkSku('Festival Sweets',  82, '2026-10-25T09:00:00Z', 'Medium' ),
    ],
  },
  {
    id: 'bangalore_store_4',
    city_id: 'bangalore',
    name: 'Bangalore Store 4',
    area: 'MG Road',
    address: 'Mahatma Gandhi Road, Bengaluru – 560001',
    daily_revenue: 68700,
    inventory: [
      mkSku('Cola 12-pk',      340, '2026-10-20T06:00:00Z', 'Medium' ),
      mkSku('SPF50 Sunscreen', 175, '2026-10-13T08:30:00Z', 'Medium' ),
      mkSku('Umbrellas',       210, '2026-10-18T10:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    510, '2026-10-22T07:00:00Z', 'High'   ),
      mkSku('Festival Sweets', 120, '2026-10-24T09:00:00Z', 'Medium' ),
    ],
  },
  {
    id: 'bangalore_store_5',
    city_id: 'bangalore',
    name: 'Bangalore Store 5',
    area: 'Jayanagar',
    address: '11th Main, Jayanagar 4th Block, Bengaluru – 560041',
    daily_revenue: 31500,
    inventory: [
      mkSku('Cola 12-pk',      198, '2026-10-21T06:00:00Z', 'Medium' ),
      mkSku('SPF50 Sunscreen',  88, '2026-10-16T08:30:00Z', 'Medium' ),
      mkSku('Umbrellas',       140, '2026-10-20T10:00:00Z', 'Low'    ),
      // Critically low — receives warehouse replenishment
      mkSku('Potato Chips',     22, '2026-10-10T07:00:00Z', 'High'   ),
      mkSku('Festival Sweets',  66, '2026-10-25T09:00:00Z', 'Medium' ),
    ],
  },
  {
    id: 'bangalore_store_6',
    city_id: 'bangalore',
    name: 'Bangalore Store 6',
    area: 'HSR Layout',
    address: '27th Main, HSR Layout Sector 2, Bengaluru – 560102',
    daily_revenue: 44600,
    inventory: [
      mkSku('Cola 12-pk',      230, '2026-10-21T06:00:00Z', 'Medium' ),
      mkSku('SPF50 Sunscreen', 102, '2026-10-15T08:30:00Z', 'Medium' ),
      mkSku('Umbrellas',       175, '2026-10-18T10:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    360, '2026-10-23T07:00:00Z', 'Medium' ),
      mkSku('Festival Sweets',  74, '2026-10-26T09:00:00Z', 'Medium' ),
    ],
  },
  {
    id: 'bangalore_store_7',
    city_id: 'bangalore',
    name: 'Bangalore Store 7',
    area: 'Electronic City',
    address: 'Hosur Main Road, Electronic City Phase 1, Bengaluru – 560100',
    daily_revenue: 38900,
    inventory: [
      mkSku('Cola 12-pk',      255, '2026-10-20T06:00:00Z', 'Medium' ),
      mkSku('SPF50 Sunscreen', 115, '2026-10-14T08:30:00Z', 'Medium' ),
      mkSku('Umbrellas',       155, '2026-10-19T10:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    380, '2026-10-22T07:00:00Z', 'Medium' ),
      mkSku('Festival Sweets',  89, '2026-10-25T09:00:00Z', 'Medium' ),
    ],
  },
  {
    id: 'bangalore_store_8',
    city_id: 'bangalore',
    name: 'Bangalore Store 8',
    area: 'Marathahalli',
    address: 'Outer Ring Road, Marathahalli, Bengaluru – 560037',
    daily_revenue: 35200,
    inventory: [
      mkSku('Cola 12-pk',      215, '2026-10-21T06:00:00Z', 'Medium' ),
      mkSku('SPF50 Sunscreen',  96, '2026-10-15T08:30:00Z', 'Medium' ),
      mkSku('Umbrellas',       148, '2026-10-18T10:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    340, '2026-10-23T07:00:00Z', 'Medium' ),
      mkSku('Festival Sweets',  77, '2026-10-26T09:00:00Z', 'Medium' ),
    ],
  },

  // ── Coimbatore (5) ──────────────────────────────────────────────────────────
  {
    id: 'coimbatore_store_1',
    city_id: 'coimbatore',
    name: 'Coimbatore Store 1',
    area: 'RS Puram',
    address: '100 Feet Road, RS Puram, Coimbatore – 641002',
    daily_revenue: 28600,
    inventory: [
      mkSku('Cola 12-pk',      175, '2026-10-19T06:00:00Z', 'Medium'  ),
      // Overstock — stagnant at cooler 22°C; feeds inter-city transfer to Chennai
      mkSku('SPF50 Sunscreen', 380, '2026-09-30T08:00:00Z', 'Stagnant'),
      mkSku('Umbrellas',        90, '2026-10-17T09:00:00Z', 'Low'     ),
      mkSku('Potato Chips',    300, '2026-10-21T07:30:00Z', 'Medium'  ),
      mkSku('Festival Sweets', 120, '2026-10-24T10:00:00Z', 'Low'     ),
    ],
  },
  {
    id: 'coimbatore_store_2',
    city_id: 'coimbatore',
    name: 'Coimbatore Store 2',
    area: 'Gandhipuram',
    address: 'Cross Cut Road, Gandhipuram, Coimbatore – 641012',
    daily_revenue: 32100,
    inventory: [
      // Aged batch — nearing expiry, markdown candidate
      mkSku('Cola 12-pk',      210, '2026-09-28T06:00:00Z', 'Low'    ),
      mkSku('SPF50 Sunscreen', 195, '2026-10-02T08:00:00Z', 'Stagnant'),
      mkSku('Umbrellas',        75, '2026-10-17T09:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    260, '2026-10-21T07:30:00Z', 'Medium' ),
      mkSku('Festival Sweets', 145, '2026-10-24T10:00:00Z', 'Low'    ),
    ],
  },
  {
    id: 'coimbatore_store_3',
    city_id: 'coimbatore',
    name: 'Coimbatore Store 3',
    area: 'Peelamedu',
    address: 'Avinashi Road, Peelamedu, Coimbatore – 641004',
    daily_revenue: 25400,
    inventory: [
      mkSku('Cola 12-pk',      155, '2026-10-20T06:00:00Z', 'Medium' ),
      mkSku('SPF50 Sunscreen', 165, '2026-10-04T08:00:00Z', 'Stagnant'),
      mkSku('Umbrellas',        80, '2026-10-18T09:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    230, '2026-10-22T07:30:00Z', 'Medium' ),
      mkSku('Festival Sweets', 110, '2026-10-25T10:00:00Z', 'Low'    ),
    ],
  },
  {
    id: 'coimbatore_store_4',
    city_id: 'coimbatore',
    name: 'Coimbatore Store 4',
    area: 'Saibaba Colony',
    address: 'Mettupalayam Road, Saibaba Colony, Coimbatore – 641011',
    daily_revenue: 19800,
    inventory: [
      mkSku('Cola 12-pk',      130, '2026-10-20T06:00:00Z', 'Medium' ),
      mkSku('SPF50 Sunscreen', 140, '2026-10-05T08:00:00Z', 'Stagnant'),
      mkSku('Umbrellas',        65, '2026-10-18T09:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    195, '2026-10-22T07:30:00Z', 'Medium' ),
      mkSku('Festival Sweets',  90, '2026-10-25T10:00:00Z', 'Low'    ),
    ],
  },
  {
    id: 'coimbatore_store_5',
    city_id: 'coimbatore',
    name: 'Coimbatore Store 5',
    area: 'Singanallur',
    address: 'Trichy Road, Singanallur, Coimbatore – 641005',
    daily_revenue: 22300,
    inventory: [
      mkSku('Cola 12-pk',      148, '2026-10-21T06:00:00Z', 'Medium' ),
      mkSku('SPF50 Sunscreen', 220, '2026-10-03T08:00:00Z', 'Stagnant'),
      mkSku('Umbrellas',        70, '2026-10-19T09:00:00Z', 'Low'    ),
      mkSku('Potato Chips',    215, '2026-10-23T07:30:00Z', 'Medium' ),
      mkSku('Festival Sweets', 100, '2026-10-26T10:00:00Z', 'Low'    ),
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// ─── AI Decisions (5, updated with intra-city + warehouse replenishment) ──────
// ═══════════════════════════════════════════════════════════════════════════════

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
  activeCity: 'chennai',

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
  currentStore: 'Chennai',

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
