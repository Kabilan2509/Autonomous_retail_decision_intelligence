"""Agent 3 — Supplier Intelligence Agent.

Evaluates supplier reliability, calculates on-time rates and fill rates,
detects procurement risks, and recommends contract-backed alternative suppliers.
"""
from typing import Dict, Any, List
import pandas as pd
from app.agents.base_agent import BaseAgent
from app.data.repository import (
    get_suppliers, get_purchase_orders, get_supplier_product_map, get_products
)
from app.features.supplier_features import compute_supplier_performance


class SupplierIntelligenceAgent(BaseAgent):
    agent_name: str = "SupplierIntelligenceAgent"
    agent_version: str = "1.0.0"

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        target_supplier_id = context.get("supplier_id")
        target_sku_id = context.get("sku_id")

        suppliers = get_suppliers()
        pos = get_purchase_orders()
        spm = get_supplier_product_map()
        products = get_products().set_index("sku_id")

        perf_df = compute_supplier_performance(pos, suppliers)

        # Build alternative supplier lookup per SKU
        # spm has: sku_id, supplier_id, priority, contract_unit_cost
        backup_map = {}
        for sku_id, group in spm.groupby("sku_id"):
            sorted_suppliers = group.sort_values("priority")
            backup_map[sku_id] = sorted_suppliers.to_dict(orient="records")

        metrics_list = []
        for _, row in perf_df.iterrows():
            sup_id = row["supplier_id"]
            if target_supplier_id and target_supplier_id != sup_id:
                continue

            delay_rate = float(row.get("delay_rate", 0.0))
            fill_rate = float(row.get("fill_rate", 1.0))
            rej_rate = float(row.get("rejection_rate", 0.0))
            risk_score = float(row.get("supplier_risk_score", 0.1))

            # SKUs provided by this supplier
            sup_skus = spm[spm["supplier_id"] == sup_id]["sku_id"].tolist()

            # Recommendation
            if risk_score > 0.40:
                status = "CRITICAL_RISK"
                action_rec = "Divert purchase orders to verified secondary backup supplier"
            elif delay_rate > 0.20 or fill_rate < 0.85:
                status = "ELEVATED_RISK"
                action_rec = "Increase order safety buffer lead time by +2 days"
            else:
                status = "HEALTHY"
                action_rec = "Maintain standard reorder policy"

            metrics_list.append({
                "supplier_id": sup_id,
                "supplier_name": row.get("supplier_name", sup_id),
                "supplier_type": row.get("supplier_type", "General"),
                "base_lead_time_days": int(row.get("base_lead_time_days", 3)),
                "delay_rate": round(delay_rate, 3),
                "fill_rate": round(fill_rate, 3),
                "rejection_rate": round(rej_rate, 3),
                "supplier_risk_score": round(risk_score, 3),
                "status": status,
                "affected_skus": sup_skus,
                "recommendation": action_rec
            })

        # Check alternative recommendation for a specific SKU if requested
        sku_alternatives = []
        if target_sku_id and target_sku_id in backup_map:
            sku_alternatives = backup_map[target_sku_id]

        return {
            "agent": self.agent_name,
            "version": self.agent_version,
            "total_suppliers_monitored": len(metrics_list),
            "suppliers": metrics_list,
            "sku_alternatives": sku_alternatives
        }

    def validate_output(self, output: Dict[str, Any]) -> bool:
        return "suppliers" in output and len(output["suppliers"]) > 0
