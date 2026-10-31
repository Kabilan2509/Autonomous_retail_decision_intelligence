# Dataset V3 — Expiry and Wastage Recalibration

- Recalculated expired units using a transparent daily guardrail: ceil(5% of latent demand), with a minimum one-unit allowance when the original simulation recorded expiry, never exceeding stock available after fulfilled sales.
- Recomputed closing stock using opening stock + receipts - fulfilled sales - expired units.
- Rebuilt the wastage ledger from revised expiry events and product costs.
- Updated the final inventory snapshot from revised final-day closing stock.
- Regenerated chronological train, validation and test splits.

The 5% cap/minimum-one-unit rule is a configurable synthetic scenario assumption, not a real-world benchmark. This is a targeted expiry/wastage recalibration, not a complete procurement and FIFO lot-age simulation. Purchase orders and goods receipts remain from V2. Do not claim the patch is a measured AI-driven reduction in real retail wastage.
See the V3 config, quality report and expiry recalibration audit in `documentation/`.
