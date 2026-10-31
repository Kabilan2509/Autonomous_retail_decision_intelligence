# Retail Decision Intelligence Dataset V2

Synthetic, reproducible dataset for multi-agent retail decision intelligence.

## Scope
- Bangalore: 8 stores; Chennai: 7; Coimbatore: 5
- 20 stores; 100 distinct retail SKUs; 20 suppliers
- 365 daily periods: 2025-11-01 through 2026-10-31
- Sales rows represent active store-SKU assortment pairs; some niche SKUs are not ranged in every store.

## Contents
- master/: stores, products, suppliers, SKU-supplier mapping, store assortment
- historical/: daily sales, promotions, events, weather, competitor prices, purchase orders, receipts and wastage
- operational/: inventory snapshot, transfer history, weekly price history and seed decision examples
- external_signals/: synthetic news examples and category mapping
- simulation/: jury surprise scenarios
- evaluation/: chronological train/validation/test splits and benchmark policies
- documentation/: metadata and quality report

## Important fields
- demand_units: latent true customer demand; use as prediction target, never as same-day input feature
- quantity: fulfilled sales units
- lost_sales_units: demand minus fulfilled units
- revenue: fulfilled quantity × realized unit price
- gross_profit: revenue minus cost of goods sold
- closing_stock_units: end-of-day on-hand stock after sales and expiry

## News
News rows are synthetic examples, not live articles. Replace/supplement with a licensed live news API. Verify city and event location, deduplicate, apply freshness and confidence thresholds, and calibrate uplift against observed outcomes. News should be contextual evidence, not a direct hardcoded demand multiplier.

## Evaluation
Chronological splits:
- Train: 2025-11-01 to 2026-07-31
- Validation: 2026-08-01 to 2026-09-30
- Test: 2026-10-01 to 2026-10-31

Avoid leakage: demand_units and lost_sales_units are labels/outcomes. Fit transforms on training data only. Do not use future receipts, future stock, or realized same-day variables unavailable at decision time as features.

## Caveats
All data is synthetic and for prototype development, not real market reporting. Purchase order, inventory and transfer records are simulation-grade and should be reconciled further before final KPI claims. decision_logs_seed.csv contains heuristic examples, not validated agent outputs.


## Final generation counts
- Sales observations: 658,825; rows exist for active store-SKU assortment pairs.
- Unique product names: 100.
- Purchase orders: 40,782; includes received, delayed, cancelled and in-transit records.
- Daily stock flow can be checked as: opening_stock_units + receipts_units - expired_units - quantity = closing_stock_units.
- `expired_units` is joined from the wastage ledger for the same store/SKU/day.
