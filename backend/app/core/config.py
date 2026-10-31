"""Central configuration for the ARDI backend."""
import os
from pathlib import Path

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parents[3]          # d:/TCS AI
DATA_DIR = BASE_DIR / "retail_decision_intelligence_v3"
OUTPUTS_DIR = BASE_DIR / "outputs"
MODELS_DIR = OUTPUTS_DIR / "models"
FORECASTS_DIR = OUTPUTS_DIR / "forecasts"
DECISIONS_DIR = OUTPUTS_DIR / "decisions"
SIMULATIONS_DIR = OUTPUTS_DIR / "simulations"
EVALUATIONS_DIR = OUTPUTS_DIR / "evaluations"

# ─── Dataset sub-paths ────────────────────────────────────────────────────────
MASTER_DIR = DATA_DIR / "master"
HISTORICAL_DIR = DATA_DIR / "historical"
OPERATIONAL_DIR = DATA_DIR / "operational"
EXTERNAL_DIR = DATA_DIR / "external_signals"
SIMULATION_DIR = DATA_DIR / "simulation"
EVALUATION_DIR = DATA_DIR / "evaluation"
DOCUMENTATION_DIR = DATA_DIR / "documentation"

# ─── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/ardi.db")

# ─── Chronological splits (verified from manifest) ────────────────────────────
TRAIN_START = "2025-11-01"
TRAIN_END = "2026-07-31"
VALIDATION_START = "2026-08-01"
VALIDATION_END = "2026-09-30"
TEST_START = "2026-10-01"
TEST_END = "2026-10-31"

# ─── Decision thresholds ──────────────────────────────────────────────────────
MIN_CONFIDENCE_THRESHOLD = 0.55          # Below this → NO_ACTION or HUMAN_REVIEW
STOCKOUT_RISK_DAYS = 3                   # Days-of-cover below this = stockout risk
EXCESS_STOCK_DAYS = 30                   # Days-of-cover above this = excess
EXPIRY_RISK_DAYS_THRESHOLD = 3           # Shelf-life remaining below this = expiry risk
MIN_MARGIN_PCT = 0.10                    # Never recommend selling below 10% margin
MAX_TRANSFER_DISTANCE_KM = 200.0
MARKDOWN_MAX_PCT = 0.40                  # Max markdown = 40%

# ─── Forecast settings ────────────────────────────────────────────────────────
FORECAST_HORIZON_DAYS = 7
FORECAST_MODELS = ["seasonal_naive", "moving_average", "exponential_smoothing",
                   "random_forest", "lightgbm"]

# ─── Application ──────────────────────────────────────────────────────────────
APP_TITLE = "ARDI — Autonomous Retail Decision Intelligence"
APP_VERSION = "1.0.0"
API_PREFIX = "/api/v1"
CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

# ─── LLM (optional) ───────────────────────────────────────────────────────────
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
LLM_ENABLED = bool(OPENAI_API_KEY or GEMINI_API_KEY)

# ─── News API (optional) ──────────────────────────────────────────────────────
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
NEWS_API_ENABLED = bool(NEWS_API_KEY)

# ─── Weather API (optional) ───────────────────────────────────────────────────
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")
WEATHER_API_ENABLED = bool(WEATHER_API_KEY)
