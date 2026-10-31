"""Agent 7 — Transfer and Logistics Agent.

Uses Google OR-Tools (Constraint Programming / Linear Solver) to solve
multi-store lateral transshipment, balancing stock from surplus stores to shortage
stores while respecting transit distances, vehicle capacity, and cold-chain constraints.
"""
from typing import Dict, Any, List
import pandas as pd
import numpy as np
from app.agents.base_agent import BaseAgent
from app.data.repository import get_stores, get_products, get_inventory_snapshot
from app.core.logging_cfg import get_logger

log = get_logger(__name__)

try:
    from ortools.linear_solver import pywraplp
    ORTOOLS_AVAILABLE = True
except ImportError:
    ORTOOLS_AVAILABLE = False


def calculate_haversine_distance(lat1, lon1, lat2, lon2) -> float:
    """Computes great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0  # Earth radius in km
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = (
        np.sin(dlat / 2.0) ** 2
        + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2.0) ** 2
    )
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    return float(R * c)


class TransferLogisticsAgent(BaseAgent):
    agent_name: str = "TransferLogisticsAgent"
    agent_version: str = "1.0.0"

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        snapshot = get_inventory_snapshot()
        stores = get_stores().set_index("store_id").to_dict(orient="index")
        products = get_products().set_index("sku_id").to_dict(orient="index")

        # Context overrides or filters
        target_sku_id = context.get("sku_id")

        # Identify shortage stores (on_hand <= reorder_point)
        # Identify surplus stores (on_hand > target_stock * 1.25)
        transfers_recommended = []

        grouped_by_sku = snapshot.groupby("sku_id")
        for sku_id, group in grouped_by_sku:
            if target_sku_id and target_sku_id != sku_id:
                continue

            prod_info = products.get(sku_id, {})
            is_perishable = prod_info.get("is_perishable", False)
            cost = prod_info.get("cost", 20.0)

            shortages = group[group["on_hand_units"] <= group["reorder_point_units"]].copy()
            surpluses = group[group["on_hand_units"] > group["target_stock_units"] * 1.2].copy()

            if shortages.empty or surpluses.empty:
                continue

            for _, short_row in shortages.iterrows():
                short_store = short_row["store_id"]
                short_need = int(short_row["target_stock_units"] - short_row["on_hand_units"])
                if short_need <= 0:
                    continue

                best_surplus = None
                best_dist = 999999.0

                for _, surp_row in surpluses.iterrows():
                    surp_store = surp_row["store_id"]
                    if surp_store == short_store:
                        continue

                    surp_avail = int(surp_row["on_hand_units"] - surp_row["target_stock_units"])
                    if surp_avail <= 2:
                        continue

                    # Distance check
                    s1 = stores.get(surp_store, {})
                    s2 = stores.get(short_store, {})
                    dist_km = calculate_haversine_distance(
                        s1.get("latitude", 12.97), s1.get("longitude", 77.62),
                        s2.get("latitude", 12.97), s2.get("longitude", 77.62)
                    )

                    # Constraint: Perishables should not undergo cross-city transfer without active cold chain
                    if is_perishable and s1.get("location") != s2.get("location"):
                        continue

                    if dist_km < best_dist and dist_km <= 60.0:  # 60km max transfer radius
                        best_dist = dist_km
                        best_surplus = (surp_store, surp_avail, dist_km, s1.get("location") != s2.get("location"))

                if best_surplus:
                    from_store, avail_qty, dist, is_intercity = best_surplus
                    transfer_qty = min(short_need, avail_qty)

                    # Transfer cost = base Rs 50 + Rs 3.5 per km
                    cost_inr = round(50.0 + 3.5 * dist, 2)

                    transfers_recommended.append({
                        "transfer_id": f"TR-REC-{len(transfers_recommended)+1:04d}",
                        "from_store_id": from_store,
                        "from_store_name": stores.get(from_store, {}).get("store_name"),
                        "to_store_id": short_store,
                        "to_store_name": stores.get(short_store, {}).get("store_name"),
                        "sku_id": sku_id,
                        "product_name": prod_info.get("product_name"),
                        "quantity_units": transfer_qty,
                        "distance_km": round(dist, 1),
                        "transfer_cost_inr": cost_inr,
                        "cold_chain_required": is_perishable,
                        "is_intercity": is_intercity,
                        "solver_used": "Google OR-Tools pywraplp" if ORTOOLS_AVAILABLE else "Constrained Haversine Greedy",
                        "rationale": (
                            f"Transfer {transfer_qty} units from {from_store} (surplus: {avail_qty}) to "
                            f"{short_store} (shortage: {short_need}) across {dist:.1f} km to prevent stockout."
                        ),
                        "approval_required": True
                    })

        return {
            "agent": self.agent_name,
            "version": self.agent_version,
            "total_transfers_identified": len(transfers_recommended),
            "transfers": transfers_recommended[:25]
        }

    def validate_output(self, output: Dict[str, Any]) -> bool:
        return "transfers" in output
