# DATA DICTIONARY — Retail Decision Intelligence Dataset V3

> **Generated**: 2026-10-31  
> **Dataset**: Retail Decision Intelligence Dataset V3 (synthetic)  
> **Source directory**: `retail_decision_intelligence_v3/`  
> **Validation status**: All schema checks PASSED

---

## Chronological Splits (verified from manifest)

| Split | Start | End | Rows |
|-------|-------|-----|------|
| Train | 2025-11-01 | 2026-07-31 | 492,765 |
| Validation | 2026-08-01 | 2026-09-30 | 110,105 |
| Test | 2026-10-01 | 2026-10-31 | 55,955 |

> **IMPORTANT**: `demand_units` and `lost_sales_units` are forecast targets — never use as same-day input features. All transformers and scalers must be fit on **train split only**.

---

## master/stores.csv

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| store_id | str | Primary key, e.g. `ST001` | 20 stores |
| store_name | str | Display name | |
| location | str | City: `Bangalore`, `Chennai`, `Coimbatore` | NOT a `city` column |
| neighborhood | str | Sub-area within city | |
| region | str | State/region, e.g. `Karnataka` | |
| store_type | str | `Urban`, `Residential`, `Commercial`, `Transit` | |
| capacity_units | int | Total store capacity in units | |
| shelf_capacity_units | int | Shelf capacity in units | |
| latitude | float | GPS latitude | |
| longitude | float | GPS longitude | |
| operating_cost_per_day | float | Daily opex in INR | |

**City distribution**: Bangalore: 8, Chennai: 7, Coimbatore: 5

---

## master/products.csv

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| sku_id | str | Primary key, e.g. `SKU0001` | 100 SKUs |
| product_name | str | Product display name | |
| category | str | e.g. `Vegetables`, `Fruits`, `Dairy` | 19 categories |
| subcategory | str | Fine-grained category | |
| unit_of_measure | str | `kg`, `litre`, `unit`, etc. | |
| cost | float | Unit procurement cost (INR) | |
| selling_price | float | Standard selling price (INR) | |
| gross_margin_per_unit | float | `selling_price - cost` (INR) | |
| gross_margin_pct | float | Gross margin percentage [0–1] | |
| shelf_life_days | int | Product shelf life in days | |
| is_perishable | bool | `True` = perishable product | NOT `perishable` |
| demand_profile | str | `high`, `medium`, `low` | |
| base_daily_demand_units | float | Baseline daily demand per store | |
| min_stock_units | int | Minimum stock threshold | |
| target_stock_units | int | Target replenishment level | |
| max_stock_units | int | Maximum permissible stock | |

---

## master/suppliers.csv

| Column | Type | Description |
|--------|------|-------------|
| supplier_id | str | Primary key, e.g. `SUP001` |
| supplier_name | str | Display name |
| supplier_type | str | `Fresh Produce`, `FMCG Distributor`, `Dairy Distributor`, `General Distributor` |
| base_lead_time_days | int | Standard delivery lead time |
| reliability_score | float | Overall reliability [0–1] |
| on_time_rate | float | On-time delivery rate [0–1] |
| quality_rejection_rate | float | Proportion of rejected units [0–1] |
| minimum_order_quantity | int | MOQ |
| supplier_region | str | e.g. `Karnataka`, `Tamil Nadu`, `National` |
| active | bool | Whether supplier is currently active |

---

## master/supplier_product_map.csv

| Column | Type | Description |
|--------|------|-------------|
| sku_id | str | FK -> products.sku_id |
| supplier_id | str | FK -> suppliers.supplier_id |
| priority | int | 1 = primary supplier, 2 = backup |
| contract_unit_cost | float | Contracted cost for this supplier (INR) |

---

## master/store_assortment.csv

| Column | Type | Description |
|--------|------|-------------|
| store_id | str | FK -> stores.store_id |
| sku_id | str | FK -> products.sku_id |
| is_ranged | bool | Whether SKU is stocked in this store |
| assortment_start_date | date | Date SKU was added to store |

---

## historical/sales_daily.csv

**Primary key**: `(date, store_id, sku_id)` — 658,825 rows, 0 duplicates

| Column | Type | Description | Notes |
|--------|------|-------------|-------|
| date | date | Sale date (YYYY-MM-DD) | |
| store_id | str | FK -> stores.store_id | |
| sku_id | str | FK -> products.sku_id | |
| opening_stock_units | int | Stock at start of day | |
| receipts_units | int | Units received this day | |
| demand_units | float | **Latent true demand** — TARGET only | Never as input feature |
| quantity | int | Actually fulfilled sales units | |
| lost_sales_units | float | `demand_units - quantity` | |
| closing_stock_units | int | Stock at end of day | |
| unit_price | float | Effective selling price (INR) | |
| discount_pct | float | Discount applied [0–1] | |
| revenue | float | `quantity * unit_price` (INR) | Verified: 0 mismatches |
| cogs | float | Cost of goods sold (INR) | |
| gross_profit | float | `revenue - cogs` (INR) | |
| returns_units | int | Units returned | |
| channel | str | `In-store`, `Online` | |
| temperature_c | float | Ambient temperature (°C) | Denormalised from weather |
| rainfall_mm | float | Rainfall (mm) | Denormalised from weather |
| competitor_price | float | Competitor price (INR) | Denormalised |
| news_signal_present | bool | Whether a news signal exists | |
| promotion_active | bool | Whether a promotion is running | |
| expired_units | int | Units expired this day | |

**Stock Equation**:
`opening_stock_units + receipts_units - quantity - expired_units = closing_stock_units` (0 mismatches verified).

---

## operational/inventory_snapshot.csv (Snapshot: 2026-10-31)

| Column | Type | Description |
|--------|------|-------------|
| snapshot_date | date | Date of snapshot — NOT `date` |
| store_id | str | FK -> stores |
| sku_id | str | FK -> products |
| on_hand_units | int | Physical stock on hand |
| reserved_units | int | Units reserved for pending orders |
| in_transit_units | int | Units in transit from supplier |
| reorder_point_units | int | Trigger reorder when stock <= this |
| target_stock_units | int | Target stock level |
| max_stock_units | int | Maximum allowed stock |
| days_of_cover_estimate | float | Estimated days of stock cover |
| expiry_risk_flag | bool | True if expiry risk detected |

---

## operational/inventory_transfers.csv

| Column | Type | Description |
|--------|------|-------------|
| transfer_id | str | Primary key |
| from_store_id | str | Source store |
| to_store_id | str | Destination store |
| sku_id | str | FK -> products |
| quantity_units | int | Units transferred |
| distance_km | float | Inter-store distance |
| estimated_transit_hours | float | Estimated transit time |
| transfer_cost | float | Transfer cost (INR) |
| status | str | `Completed`, `Pending`, `Rejected` |
| transfer_date | date | Date of transfer — NOT `date` |
| is_intercity | bool | Cross-city transfer flag |
| cold_chain_required | bool | Requires cold chain logistics |

---

## external_signals/news_signals_synthetic.csv

| Column | Type | Description |
|--------|------|-------------|
| news_id | str | Primary key |
| published_at | datetime | Publication timestamp |
| location | str | City |
| headline | str | News headline |
| source | str | News source |
| url | str | URL |
| category | str | Category |
| event_type | str | Event type |
| affected_categories | str | Semicolon-separated categories |
| relevance_score | float | Relevance [0–1] |
| demand_impact_direction | str | `Positive`, `Negative`, `Neutral` |
| simulated_uplift_factor | float | Synthetic demand multiplier |
| confidence | float | Confidence [0–1] |
| verification_status | str | Synthetic simulation status |
| deduplication_key | str | Key for deduplication |
| impact_window_days | int | Impact duration |

---

## simulation/surprise_scenarios.csv

| Scenario ID | Type | Location | Target | Description |
|---|---|---|---|---|
| SC001 | Supplier Failure | Chennai | SUP003 | supplier_reliability=0; delay open orders by 7 days |
| SC002 | Demand Spike | Bangalore | SKU0001 | demand_multiplier=1.60; duration_days=5 |
| SC003 | Heavy Rain | Coimbatore | ALL | rainfall_mm=60; delivery_delay_multiplier=1.5 |
| SC004 | Competitor Discount | Chennai | SKU0038 | competitor_price_multiplier=0.75; duration_days=7 |
| SC005 | News Event | Bangalore | STORE_CATCHMENT | event_footfall_multiplier=2; duration_days=2 |
| SC006 | Cold Chain Failure | Coimbatore | PERISHABLES | cold_chain_status=failed; duration_hours=8 |
| SC007 | Store Closure | All | ST006 | store_status=closed; duration_days=2 |
| SC008 | Demand Collapse | All | CATEGORY:Seasonal | demand_multiplier=0.55; duration_days=14 |
