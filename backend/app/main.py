"""Master FastAPI Application for ARDI: Autonomous Retail Decision Intelligence."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import APP_TITLE, APP_VERSION, API_PREFIX, CORS_ORIGINS
from app.api.routes import (
    dashboard,
    forecasts,
    inventory,
    suppliers,
    pricing,
    external,
    decisions,
    logistics,
    scenarios,
    evaluation
)
from app.core.logging_cfg import get_logger

log = get_logger("ARDI.Main")

app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description="Multi-Agent Autonomous Retail Decision Intelligence Platform (Challenge 10)",
    docs_url=f"{API_PREFIX}/docs",
    openapi_url=f"{API_PREFIX}/openapi.json"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for hackathon demonstration
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(dashboard.router, prefix=API_PREFIX)
app.include_router(forecasts.router, prefix=API_PREFIX)
app.include_router(inventory.router, prefix=API_PREFIX)
app.include_router(suppliers.router, prefix=API_PREFIX)
app.include_router(pricing.router, prefix=API_PREFIX)
app.include_router(external.router, prefix=API_PREFIX)
app.include_router(decisions.router, prefix=API_PREFIX)
app.include_router(logistics.router, prefix=API_PREFIX)
app.include_router(scenarios.router, prefix=API_PREFIX)
app.include_router(evaluation.router, prefix=API_PREFIX)


@app.get("/")
def root():
    return {
        "system": APP_TITLE,
        "version": APP_VERSION,
        "status": "operational",
        "api_docs": f"{API_PREFIX}/docs",
        "intelligence_cycle": "OBSERVE -> PREDICT -> REASON -> DECIDE -> ACT -> MEASURE -> ADAPT"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
