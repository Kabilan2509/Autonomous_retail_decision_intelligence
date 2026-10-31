"""Evaluation metrics for demand forecasting."""
from __future__ import annotations

import numpy as np
from typing import Union

ArrayLike = Union[list, np.ndarray]


def compute_metrics(y_true: ArrayLike, y_pred: ArrayLike) -> dict:
    """Compute standard demand-forecasting evaluation metrics.

    Parameters
    ----------
    y_true : array-like
        Observed demand values (actuals).
    y_pred : array-like
        Predicted demand values.

    Returns
    -------
    dict with keys:
        wape  – Weighted Absolute Percentage Error  (lower is better)
        mae   – Mean Absolute Error
        rmse  – Root Mean Squared Error
        bias  – Mean signed error  (pred - actual); positive = over-forecast
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)

    if len(y_true) == 0:
        return {"wape": float("nan"), "mae": float("nan"),
                "rmse": float("nan"), "bias": float("nan")}

    errors = y_pred - y_true
    abs_errors = np.abs(errors)

    # WAPE: sum |actual - pred| / sum |actual|  (handles zero actuals gracefully)
    denom = np.sum(np.abs(y_true))
    wape = float(np.sum(abs_errors) / denom) if denom > 0 else float("nan")

    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    bias = float(np.mean(errors))

    return {"wape": wape, "mae": mae, "rmse": rmse, "bias": bias}


# ─── Quick smoke-test ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

    from app.core.logging_cfg import get_logger
    log = get_logger(__name__)

    y_true = [10, 20, 30, 40, 50]
    y_pred = [12, 18, 33, 38, 55]
    m = compute_metrics(y_true, y_pred)
    log.info("Metrics: %s", m)
    assert 0 < m["wape"] < 1, "WAPE should be between 0 and 1 for reasonable forecasts"
    log.info("✅ evaluate.py smoke-test PASSED")
