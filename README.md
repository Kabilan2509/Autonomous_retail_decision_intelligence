# ARDI — Autonomous Retail Decision Intelligence Platform
## Challenge 10: AI for Business | Retail & CPG

> An end-to-end multi-agent retail decision intelligence system that continuously observes retail operations, predicts demand, reasons over internal and external signals, recommends specific store-level business actions, explains the underlying rationale, and audits the business outcome.

---

## 1. System Intelligence Cycle
```
OBSERVE → PREDICT → REASON → DECIDE → ACT → MEASURE → ADAPT
```

---

## 2. Model & Optimization Architecture

| # | Component | Exact Model / Solver | Role & Implementation |
|---|---|---|---|
| 1 | **Demand Shock Forecaster** | **Amazon Chronos-Bolt** (`amazon/chronos-bolt-base`) | Foundation time-series model predicting future demand spikes using historical sales, weather, and calendar features. |
| 2 | **P90 Safety Stock Risk** | **MAPIE (Conformal Regression)** | Distribution-free conformal intervals providing mathematically guaranteed P90/P95 safety stock bands. |
| 3 | **News Event Extractor** | **DeBERTa-v3** (`microsoft/deberta-v3-base`) | Zero-shot NLP extraction of transport disruptions, heatwaves, and local strikes. |
| 4 | **Pricing & Margin Agility** | **Microsoft EconML (DRLearner)** | Causal treatment effect estimation to prevent margin and discount cannibalization (10% gross profit floor). |
| 5 | **Lateral Transshipment** | **Google OR-Tools** | Solves multi-store route distances and stock surplus-to-shortage rebalancing under 60km and cold-chain constraints. |
| 6 | **Action Decision Optimizer**| **HiGHS Mixed-Integer Linear Solver** | Discrete MILP solver mathematically selecting the winning action among the candidate options. |
| 7 | **Decision Rationale ("The Why")**| **Qwen-2.5-7B-Instruct** | Synthesizes natural-language business explanations for store managers detailing rejected alternatives and evidence. |

---

## 3. Quickstart & Demonstration

### Step 1: Start the Backend (FastAPI)
```powershell
cd "d:\TCS AI"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API Swagger Documentation*: `http://127.0.0.1:8000/api/v1/docs`

### Step 2: Start the Frontend (React + Vite)
```powershell
cd "d:\TCS AI\ardi-app"
npm run dev
```
*Web Application*: `http://localhost:5173`

---

## 4. Ten Demonstrable Dashboard Pages

1. **AI Decision Center** (`/app/decision-hub`): Live feed of prioritized recommendations (REPLENISH, TRANSFER, MARKDOWN) with interactive Approve, Reject, and Request Review buttons, and Qwen-2.5 decision rationale modal.
2. **Executive Overview** (`/app/overview`): City cluster performance (Bangalore, Chennai, Coimbatore), macro revenue, stockout exposure, and wastage costs.
3. **Demand Intelligence** (`/app/demand`): 7-day demand projections with Amazon Chronos-Bolt and MAPIE P90/P10 uncertainty bands.
4. **Inventory Control** (`/app/inventory`): Live store ledger, days of cover, reorder triggers, and expiry risk monitoring.
5. **Supplier Risk** (`/app/suppliers`): Reliability metrics, fill rates, delivery delays, and contract backup supplier mappings.
6. **Pricing & Margin** (`/app/pricing`): Competitor price gaps, EconML causal elasticity, and approved markdown limits with margin floors.
7. **News & Weather** (`/app/external`): DeBERTa-v3 disruption signals and localized weather demand shocks.
8. **Lateral Logistics** (`/app/logistics-map`): OR-Tools store-to-store stock balancing routes.
9. **Simulation Lab** (`/app/simulation-lab`): Interactive runner for all 8 surprise disruption scenarios (Supplier Failure, Tomato Demand Spike, Coimbatore Rain, etc.).
10. **KPI & Audit Center** (`/app/audit`): Head-to-head empirical audit comparing Baseline Policy B0 against the ARDI Multi-Agent System.

---

## 5. Measured Business Lift (Test Period Evaluation)

- **Stockout Rate**: Reduced by **48.1%** (from 7.42% to 3.85%)
- **Lost Sales Rescued**: **+24,100 units** captured
- **Wastage Cost Saved**: Reduced by **40.2%** (from ₹8.20L to ₹4.90L)
- **Gross Margin Expansion**: **+320 bps** lift
