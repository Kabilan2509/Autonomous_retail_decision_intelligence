# API DOCUMENTATION — ARDI BACKEND SERVICES

Base URL: `http://localhost:8000/api/v1`
Interactive Swagger Docs: `http://localhost:8000/api/v1/docs`

---

## 1. Executive Dashboard
- **`GET /dashboard/summary`**: Returns macro revenue, gross profit, stockout risk SKUs, expiry risk SKUs, wastage cost, and city cluster performance.

---

## 2. Demand Forecasting
- **`GET /forecasts/predict/{store_id}/{sku_id}?horizon_days=7`**: Generates 7-day demand projections with Amazon Chronos-Bolt and MAPIE P90/P10 uncertainty bands.
- **`GET /forecasts/batch?store_id={store_id}&limit=20`**: Generates forecasts for multiple SKUs in a store.

---

## 3. Inventory Control
- **`GET /inventory/snapshot?limit=50&store_id={store_id}&category={category}`**: Returns on-hand units, reserved stock, in-transit units, reorder points, target stock, and days of cover.
- **`GET /inventory/risks`**: Returns SKUs currently in critical stockout or expiry danger.

---

## 4. Supplier Intelligence
- **`GET /suppliers/metrics?supplier_id={supplier_id}`**: Returns delay rates, fill rates, quality rejection rates, and supplier risk scores.
- **`GET /suppliers/alternative-sources/{sku_id}`**: Retrieves priority-ranked contract backup suppliers from `supplier_product_map.csv`.

---

## 5. Pricing Intelligence
- **`GET /pricing/analysis?sku_id={sku_id}`**: Returns competitor price gaps, Microsoft EconML causal elasticity, and approved markdown limits with margin floors.

---

## 6. External Signals
- **`GET /external/news?location={location}`**: Returns DeBERTa-v3 NLP disruption signals, event types, severity scores, and calibrated demand multipliers.
- **`GET /external/weather?location={location}`**: Returns ambient temperatures, precipitation (mm), and localized fulfillment risk levels.

---

## 7. AI Decision Center (Governance)
- **`GET /decisions/?limit=50&action={action}&approval_status={status}`**: Returns live recommendations with Qwen-2.5 decision rationale, evidence, and constraints.
- **`POST /decisions/generate`**: Runs the central multi-agent orchestrator.
- **`PATCH /decisions/{id}/approve`**: Approves a decision (marks for simulated execution).
- **`PATCH /decisions/{id}/reject`**: Rejects a decision with reviewer notes.
- **`PATCH /decisions/{id}/request-review`**: Flags recommendation for human supervisory review.

---

## 8. Lateral Logistics
- **`GET /logistics/transfers?sku_id={sku_id}`**: Solves multi-store stock surplus and shortage transshipments via Google OR-Tools.

---

## 9. Simulation Lab
- **`GET /scenarios/`**: Lists all 8 surprise disruption scenarios.
- **`POST /scenarios/run`**: Injects scenario parameters, triggers agent recalculation, and returns before/after business deltas.

---

## 10. Evaluation & Audit
- **`GET /evaluation/kpis`**: Returns macroeconomic KPIs.
- **`GET /evaluation/baseline-comparison`**: Returns head-to-head metrics comparing Baseline Policy B0 against ARDI Multi-Agent System.
