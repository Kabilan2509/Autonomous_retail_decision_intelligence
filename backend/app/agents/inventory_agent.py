"""Agent 2 — Inventory Optimization Agent.

Analyzes on-hand stock, forecast demand, MAPIE P90 safety stock, reorder points,
and store shelf capacity to generate optimal inventory actions using HiGHS MILP.
"""
from typing import Dict, Any, List
import pandas as pd
from app.agents.base_agent import BaseAgent
from app.data.repository import get_inventory_snapshot, get_products, get_stores
from app.features.inventory_features import compute_inventory_metrics
from app.decision_engine.milp_optimizer import HighsActionOptimizer


class InventoryOptimizationAgent(BaseAgent):
    agent_name: str = "InventoryOptimizationAgent"
    agent_version: str = "1.0.0"

    def __init__(self):
        super().__init__()
        self.optimizer = HighsActionOptimizer()

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        target_store_id = context.get("store_id")
        target_sku_id = context.get("sku_id")
        forecast_map = context.get("forecast_demand_map", {})
        p90_map = context.get("p90_demand_map", {})
        supplier_risk_map = context.get("supplier_risk_map", {})

        snapshot = get_inventory_snapshot()
        products = get_products()
        stores = get_stores().set_index("store_id").to_dict(orient="index")

        # Enrich inventory
        enriched = compute_inventory_metrics(snapshot, products, forecast_map)

        recommendations = []
        for _, row in enriched.iterrows():
            store_id = row["store_id"]
            sku_id = row["sku_id"]

            if target_store_id and target_store_id != store_id:
                continue
            if target_sku_id and target_sku_id != sku_id:
                continue

            fc_demand = forecast_map.get((store_id, sku_id), row["avg_daily_demand"] * 7.0)
            p90_demand = p90_map.get((store_id, sku_id), fc_demand * 1.35)
            sup_risk = supplier_risk_map.get(sku_id, 0.15)

            on_hand = int(row["on_hand_units"])
            target_stock = int(row["target_stock_units"])
            max_stock = int(row["max_stock_units"])
            cost = float(row["cost"])
            price = float(row["selling_price"])
            is_perishable = bool(row["is_perishable"])
            days_cover = float(row["days_of_cover"])

            # Call HiGHS MILP Optimizer
            opt_res = self.optimizer.optimize_action(
                forecast_demand=fc_demand,
                p90_demand=p90_demand,
                on_hand=on_hand,
                target_stock=target_stock,
                max_stock=max_stock,
                unit_cost=cost,
                unit_price=price,
                is_perishable=is_perishable,
                days_of_cover=days_cover,
                supplier_risk=sup_risk
            )

            action = opt_res["action"]
            qty = opt_res["recommended_quantity"]

            confidence = 0.90 if action != "NO_ACTION" else 0.75
            if days_cover < 1.0 or row["is_expiry_risk"]:
                priority = "HIGH"
            elif action in ["REPLENISH", "TRANSFER"]:
                priority = "MEDIUM"
            else:
                priority = "LOW"

            recommendations.append({
                "store_id": store_id,
                "sku_id": sku_id,
                "action": action,
                "recommended_quantity": qty,
                "priority": priority,
                "confidence": confidence,
                "days_of_cover": round(days_cover, 1),
                "on_hand_units": on_hand,
                "reorder_point_units": int(row["reorder_point_units"]),
                "forecast_demand_7d": round(fc_demand, 1),
                "p90_safety_demand_7d": round(p90_demand, 1),
                "is_expiry_risk": bool(row["is_expiry_risk"]),
                "is_stockout_risk": bool(row["is_stockout_risk"]),
                "solver_used": opt_res["solver"]
            })

        return {
            "agent": self.agent_name,
            "version": self.agent_version,
            "total_inventory_items_evaluated": len(recommendations),
            "recommendations": recommendations
        }

    def validate_output(self, output: Dict[str, Any]) -> bool:
        return "recommendations" in output
