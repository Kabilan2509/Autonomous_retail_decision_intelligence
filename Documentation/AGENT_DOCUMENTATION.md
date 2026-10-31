# AGENT DOCUMENTATION — ARDI MULTI-AGENT PLATFORM

## 1. Overview
The ARDI platform implements 9 specialized agents that collectively execute the intelligence cycle:
**OBSERVE → PREDICT → REASON → DECIDE → ACT → MEASURE → ADAPT**

---

## 2. Agent 1: Demand Forecasting Agent (`DemandForecastingAgent`)
- **Primary Model**: Amazon Chronos-Bolt (`amazon/chronos-bolt-base`) foundation time-series forecaster.
- **Uncertainty Bounds**: MAPIE Conformal Regression wrapper providing mathematically guaranteed distribution-free P90/P10 prediction intervals.
- **Fallback Hierarchy**: LightGBM Point Regressor → Exponential Smoothing → Seasonal Naive.
- **Inputs**: Store-SKU sales history, day-of-week, weather conditions, events, promotions, price ratio.
- **Outputs**: 7-day predicted demand, P90 safety upper bound, P10 lower bound, feature importances, model confidence.

---

## 3. Agent 2: Inventory Optimization Agent (`InventoryOptimizationAgent`)
- **Mathematical Engine**: HiGHS Mixed-Integer Linear Programming (MILP) Solver.
- **Objective Function**: Maximize Expected Gross Margin minus Holding Costs, Stockout Penalties, and Transfer Friction.
- **Discrete Actions**: `REPLENISH`, `TRANSFER`, `MARKDOWN`, `INCREASE_ALLOCATION`, `REDUCE_ALLOCATION`, `NO_ACTION`.
- **Inputs**: On-hand stock, reserved stock, in-transit stock, MAPIE P90 demand, store shelf capacity, unit cost, selling price.
- **Outputs**: Winning action, recommended integer quantity, priority, days of cover, risk flags.

---

## 4. Agent 3: Supplier Intelligence Agent (`SupplierIntelligenceAgent`)
- **Responsibilities**: Evaluates PO history across 20 suppliers, computes delay rates, fill rates, and quality rejection rates.
- **Risk Scoring**: Weighted multi-factor risk score: `0.45 * delay_rate + 0.35 * (1 - fill_rate) + 0.20 * rejection_rate`.
- **Backup Routing**: Dynamically queries `supplier_product_map.csv` for priority 2 verified contract suppliers.
- **Action Guidance**: Recommends lead-time safety buffers or order diversion to secondary suppliers when score > 0.40.

---

## 5. Agent 4: Pricing Intelligence Agent (`PricingIntelligenceAgent`)
- **Causal Model**: Microsoft EconML (DRLearner) Double Robust Machine Learning for treatment effect estimation.
- **Margin Floor Guardrail**: Guaranteed non-negative business solvency — strictly forbids any selling price below approved cost + 10% minimum margin floor.
- **Markdown Triggers**: Imminent perishables expiry risk or uncompetitive competitor pricing within margin tolerance.

---

## 6. Agent 5: News Intelligence Agent (`NewsIntelligenceAgent`)
- **NLP Model**: DeBERTa-v3 (`microsoft/deberta-v3-base` zero-shot classification) with calibrated keyword NLI fallback.
- **Signal Extraction**: Disruption event classification (Transport Strikes, Monsoons, Heatwaves, Public Gatherings), severity scoring [0–1], affected product categories.
- **Grounding**: News is evidence, not absolute ground truth; dampens raw uplift multipliers using confidence and historical category response.

---

## 7. Agent 6: Weather Intelligence Agent (`WeatherIntelligenceAgent`)
- **Signals Monitored**: Ambient temperature, rainfall precipitation (mm), next-day meteorological forecasts.
- **Risk Categorization**:
  - `HIGH RISK` (Rain > 30mm): Triggers delivery delay buffers (+2 days) and grocery demand surges.
  - `ELEVATED` (Temp > 35°C): Triggers heatwave surge for Beverages, Dairy, Frozen, and Fruits (+25%).

---

## 8. Agent 7: Transfer & Logistics Agent (`TransferLogisticsAgent`)
- **Optimization Engine**: Google OR-Tools (Constraint Programming / Linear Solver) for multi-store lateral transshipment.
- **Distance Metric**: Haversine great-circle calculation between store GPS coordinates.
- **Constraints**:
  - Distance threshold: Maximum 60 km lateral transit radius.
  - Perishability: Prohibits inter-city transfers for perishable items without refrigerated cold-chain verification.
  - Costing: Base ₹50 + ₹3.5 per km.

---

## 9. Agent 8: Central Decision Orchestrator (`DecisionOrchestrator`)
- **Central Coordinator**: Gathers candidate recommendations across all 7 domain agents.
- **Constraint Resolution**: Validates store capacities, MOQ, minimum margins, and confidence thresholds (>= 0.55).
- **Explainability Engine**: Qwen-2.5-7B-Instruct Decision Rationale ("The Why") synthesizer explaining why the winning action was picked and why alternatives were rejected.
- **Governance**: Implements strict Human Approval Gate (`PENDING`, `APPROVED`, `REJECTED`, `HUMAN_REVIEW`).

---

## 10. Agent 9: KPI Monitoring & Adaptation Agent (`KPIMonitoringAgent`)
- **Benchmark Policies**: B0 (Fixed Reorder Point), B1 (Seasonal Naive), B2 (ML Without News), B3 (News-Aware), B4 (Cost-Based Decision Policy).
- **Metrics Tracked**: WAPE, MAE, RMSE, Stockout Rate, Lost Sales Rescued, Wastage Cost Reduction, Recommendation Acceptance Rate.
