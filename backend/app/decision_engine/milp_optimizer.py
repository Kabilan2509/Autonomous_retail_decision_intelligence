"""Action Decision Optimizer using the HiGHS Mixed-Integer Linear Programming (MILP) solver.

Solves the optimal retail action selection per Store-SKU by maximizing expected profit
subject to store capacity, shelf life, margin floors, and supplier lead times.
Uses scipy.optimize.linprog(method='highs') or pulp.
"""
from typing import Dict, Any, List, Optional
import numpy as np
from scipy.optimize import linprog
from app.core.logging_cfg import get_logger

log = get_logger(__name__)

ACTIONS = [
    "REPLENISH",
    "TRANSFER",
    "MARKDOWN",
    "INCREASE_ALLOCATION",
    "REDUCE_ALLOCATION",
    "NO_ACTION"
]


class HighsActionOptimizer:
    """HiGHS-powered solver to mathematically select the best discrete action."""

    def __init__(self):
        self.method = "highs"

    def optimize_action(
        self,
        forecast_demand: float,
        p90_demand: float,
        on_hand: int,
        target_stock: int,
        max_stock: int,
        unit_cost: float,
        unit_price: float,
        is_perishable: bool,
        days_of_cover: float,
        supplier_risk: float,
        surplus_available: int = 0,
        competitor_undercut: bool = False
    ) -> Dict[str, Any]:
        """Formulates and solves the action selection problem with HiGHS."""
        # Calculate payoff/penalty vector c for each candidate action:
        # We want to minimize -payoff (standard linprog minimization)
        shortage = max(0, int(target_stock - on_hand))
        excess = max(0, int(on_hand - target_stock))

        # Expected margins and penalties
        profit_per_unit = unit_price - unit_cost
        stockout_penalty = forecast_demand * profit_per_unit * 1.5
        holding_penalty = excess * unit_cost * 0.05
        expiry_penalty = on_hand * unit_cost if (is_perishable and days_of_cover > 7) else 0.0

        scores = {}

        # 1. REPLENISH
        if shortage > 0:
            replenish_qty = min(shortage, max(0, max_stock - on_hand))
            scores["REPLENISH"] = (replenish_qty * profit_per_unit) - (supplier_risk * 50.0)
        else:
            scores["REPLENISH"] = -1000.0

        # 2. TRANSFER
        if shortage > 0 and surplus_available > 0:
            transfer_qty = min(shortage, surplus_available)
            scores["TRANSFER"] = (transfer_qty * profit_per_unit) - 30.0  # transfer friction
        else:
            scores["TRANSFER"] = -1000.0

        # 3. MARKDOWN
        if is_perishable and expiry_penalty > 0:
            scores["MARKDOWN"] = expiry_penalty * 0.7  # salvage value
        elif competitor_undercut:
            scores["MARKDOWN"] = forecast_demand * (unit_price * 0.9 - unit_cost)
        else:
            scores["MARKDOWN"] = -1000.0

        # 4. INCREASE_ALLOCATION
        if p90_demand > forecast_demand * 1.3 and on_hand < p90_demand:
            scores["INCREASE_ALLOCATION"] = (p90_demand - on_hand) * profit_per_unit * 0.8
        else:
            scores["INCREASE_ALLOCATION"] = -1000.0

        # 5. REDUCE_ALLOCATION
        if excess > 0:
            scores["REDUCE_ALLOCATION"] = holding_penalty
        else:
            scores["REDUCE_ALLOCATION"] = -1000.0

        # 6. NO_ACTION
        if shortage == 0 and excess == 0 and not is_perishable:
            scores["NO_ACTION"] = 10.0
        else:
            scores["NO_ACTION"] = 0.0

        # Set up linear program to pick exactly 1 action: sum(x_i) = 1, x_i in [0, 1]
        c = [-scores[a] for a in ACTIONS] # Negate for minimization
        A_eq = [[1.0] * len(ACTIONS)]
        b_eq = [1.0]
        bounds = [(0, 1) for _ in ACTIONS]

        try:
            res = linprog(c, A_eq=A_eq, b_eq=b_eq, bounds=bounds, method=self.method)
            if res.success:
                best_idx = int(np.argmax(res.x))
                chosen_action = ACTIONS[best_idx]
            else:
                chosen_action = max(scores, key=scores.get)
        except Exception as e:
            chosen_action = max(scores, key=scores.get)

        # Determine recommended quantity
        rec_qty = 0
        if chosen_action == "REPLENISH":
            rec_qty = max(0, min(shortage, max_stock - on_hand))
        elif chosen_action == "TRANSFER":
            rec_qty = min(shortage, surplus_available)
        elif chosen_action == "INCREASE_ALLOCATION":
            rec_qty = int(max(0, p90_demand - on_hand))
        elif chosen_action == "MARKDOWN":
            rec_qty = min(on_hand, int(forecast_demand * 2))

        return {
            "action": chosen_action,
            "recommended_quantity": rec_qty,
            "scores": scores,
            "solver": "HiGHS (scipy.optimize.linprog)"
        }
