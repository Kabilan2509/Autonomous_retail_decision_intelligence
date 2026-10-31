"""Pydantic schemas for all API responses and agent contracts."""
from __future__ import annotations
from datetime import datetime, date
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ─── Master ───────────────────────────────────────────────────────────────────
class StoreOut(BaseModel):
    store_id: str
    store_name: str
    location: str
    neighborhood: str
    store_type: str
    capacity_units: int
    shelf_capacity_units: int
    latitude: float
    longitude: float
    operating_cost_per_day: float


class ProductOut(BaseModel):
    sku_id: str
    product_name: str
    category: str
    subcategory: str
    unit_of_measure: str
    cost: float
    selling_price: float
    gross_margin_pct: float
    shelf_life_days: int
    is_perishable: bool
    demand_profile: str
    base_daily_demand_units: float
    min_stock_units: int
    target_stock_units: int
    max_stock_units: int


class SupplierOut(BaseModel):
    supplier_id: str
    supplier_name: str
    supplier_type: str
    base_lead_time_days: int
    reliability_score: float
    on_time_rate: float
    quality_rejection_rate: float
    minimum_order_quantity: int
    active: bool


# ─── Forecast ─────────────────────────────────────────────────────────────────
class ForecastPoint(BaseModel):
    forecast_date: date
    predicted_demand: float
    lower_bound: float
    upper_bound: float
    confidence: float


class ForecastOut(BaseModel):
    store_id: str
    sku_id: str
    model_name: str
    generated_at: datetime
    horizon_days: int
    forecasts: List[ForecastPoint]
    important_features: Optional[Dict[str, float]] = None


# ─── Inventory ────────────────────────────────────────────────────────────────
class InventoryStatus(BaseModel):
    store_id: str
    sku_id: str
    on_hand_units: int
    reserved_units: int
    in_transit_units: int
    reorder_point_units: int
    target_stock_units: int
    max_stock_units: int
    days_of_cover: float
    expiry_risk_flag: bool
    snapshot_date: date


# ─── Supplier intelligence ────────────────────────────────────────────────────
class SupplierMetrics(BaseModel):
    supplier_id: str
    supplier_name: str
    delay_rate: float
    fill_rate: float
    rejection_rate: float
    risk_score: float
    affected_skus: List[str]
    recommendation: str


# ─── Evidence item ────────────────────────────────────────────────────────────
class EvidenceItem(BaseModel):
    source: str
    value: Any
    unit: Optional[str] = None
    description: Optional[str] = None


# ─── Expected impact ──────────────────────────────────────────────────────────
class ExpectedImpact(BaseModel):
    lost_sales_risk: Optional[str] = None
    gross_profit_impact_inr: Optional[float] = None
    wastage_reduction_units: Optional[int] = None
    stockout_reduction_days: Optional[float] = None
    description: Optional[str] = None


# ─── Decision / Action ────────────────────────────────────────────────────────
class DecisionOut(BaseModel):
    decision_id: str
    store_id: str
    sku_id: str
    action: str                          # REPLENISH | TRANSFER | MARKDOWN | NO_ACTION | …
    recommended_quantity: int
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    evidence: List[EvidenceItem]
    expected_impact: ExpectedImpact
    constraints_checked: List[str]
    approval_status: str                 # PENDING | APPROVED | REJECTED | HUMAN_REVIEW
    priority: str                        # HIGH | MEDIUM | LOW
    agent_versions: Dict[str, str]
    data_provenance: List[str]
    created_at: datetime
    store_name: Optional[str] = None
    product_name: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None


class DecisionUpdateIn(BaseModel):
    approval_status: str                 # APPROVED | REJECTED | HUMAN_REVIEW
    reviewer_note: Optional[str] = None


# ─── News signal ──────────────────────────────────────────────────────────────
class NewsSignalOut(BaseModel):
    news_id: str
    published_at: datetime
    location: str
    headline: str
    event_type: str
    affected_categories: List[str]
    relevance_score: float
    demand_impact_direction: str
    confidence: float
    impact_window_days: int
    is_synthetic: bool = True


# ─── Weather signal ───────────────────────────────────────────────────────────
class WeatherSignalOut(BaseModel):
    date: date
    location: str
    temperature_c: float
    rainfall_mm: float
    weather_condition: str
    forecast_temperature_c: float
    forecast_rainfall_mm: float
    risk_level: str                      # NORMAL | ELEVATED | HIGH


# ─── Transfer recommendation ──────────────────────────────────────────────────
class TransferOut(BaseModel):
    transfer_id: str
    from_store_id: str
    to_store_id: str
    sku_id: str
    quantity_units: int
    distance_km: float
    transfer_cost_inr: float
    rationale: str
    cold_chain_required: bool
    approval_required: bool


# ─── KPI summary ──────────────────────────────────────────────────────────────
class KPISummary(BaseModel):
    period: str
    total_revenue_inr: float
    total_gross_profit_inr: float
    total_lost_sales_units: float
    total_wastage_units: int
    total_wastage_cost_inr: float
    stockout_rate_pct: float
    fill_rate_pct: float
    forecast_wape: Optional[float] = None
    active_decisions: int
    decisions_approved: int
    decisions_rejected: int


# ─── Dashboard summary ────────────────────────────────────────────────────────
class DashboardSummary(BaseModel):
    total_stores: int
    total_skus: int
    total_demand_units: float
    total_revenue_inr: float
    total_gross_profit_inr: float
    total_lost_sales_units: float
    stockout_risk_skus: int
    wastage_cost_inr: float
    active_recommendations: int
    high_priority_alerts: int
    city_performance: List[Dict[str, Any]]
    snapshot_date: date


# ─── Scenario ─────────────────────────────────────────────────────────────────
class ScenarioRunIn(BaseModel):
    scenario_id: str
    override_params: Optional[Dict[str, Any]] = None


class ScenarioResult(BaseModel):
    scenario_id: str
    scenario_type: str
    location: str
    baseline_kpis: Dict[str, Any]
    agent_kpis: Dict[str, Any]
    decisions_generated: List[DecisionOut]
    summary: str
    ran_at: datetime
