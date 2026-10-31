# KNOWN LIMITATIONS & RESPONSIBLE AI CAVEATS

## 1. Dataset Characteristics & Modeling Assumptions
- **Synthetic V3 Expiry Recalibration**: The V3 dataset replaces the V2 expiry volume with a 5% latent-demand cap. This is a synthetic scenario assumption, NOT a real-world measured retail benchmark. The system does not claim that the historical V3 reduction was achieved by AI.
- **PO and Goods Receipts**: Retain their original V2 simulation records.
- **Batch-Level Age Tracking**: The current dataset provides aggregate store-SKU stock positions rather than individual pallet-level RFID batch expiry dates.

## 2. External Signal Interpretation
- **Synthetic News Feed**: The provided news signals in `external_signals/news_signals_synthetic.csv` are synthetic examples, not live scraping.
- **Contextual Evidence**: News and weather signals are modeled strictly as contextual evidence with confidence damping, never as absolute hard multipliers.

## 3. Human-in-the-Loop Safeguards
- **Zero Hallucination Safeguard**: All financial, quantity, and reorder calculations are deterministic (HiGHS MILP and Google OR-Tools). LLMs (Qwen-2.5) are used strictly for natural-language explanatory synthesis.
- **No Direct Real-World Purchasing**: Prototype actions update the in-memory simulation and governance ledger; they do not automatically execute financial bank transactions or dispatch physical freight without human sign-off.
