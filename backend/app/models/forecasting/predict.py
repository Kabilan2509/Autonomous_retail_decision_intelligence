"""Load a trained ForecastingPipeline artifact from disk.

Falls back to a fresh (untrained) instance if the artifact does not exist
so that callers never receive a hard import error.
"""
from __future__ import annotations

from pathlib import Path

from app.core.config import MODELS_DIR
from app.core.logging_cfg import get_logger

log = get_logger(__name__)

BEST_MODEL_PATH = MODELS_DIR / "best_model.pkl"


def load_model_artifact():
    """Load and return the saved ForecastingPipeline, or a fresh instance.

    Returns
    -------
    ForecastingPipeline
        Either a fully trained pipeline (loaded from disk) or a fresh,
        untrained instance if no artifact exists yet.
    """
    # Import here to avoid circular imports
    from app.models.forecasting.train import ForecastingPipeline

    if BEST_MODEL_PATH.exists():
        log.info("Loading model artifact from %s", BEST_MODEL_PATH)
        try:
            return ForecastingPipeline.load(BEST_MODEL_PATH)
        except Exception as exc:
            log.error("Failed to load artifact (%s) – returning fresh instance.", exc)
    else:
        log.warning(
            "Model artifact not found at %s. Returning untrained pipeline.",
            BEST_MODEL_PATH,
        )

    return ForecastingPipeline()


# ─── Quick smoke-test ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

    from app.core.logging_cfg import get_logger as _gl
    _log = _gl(__name__)
    pipeline = load_model_artifact()
    _log.info("Loaded pipeline: best_model_name=%s", pipeline.best_model_name)
    _log.info("✅ predict.py smoke-test PASSED")
