# Zobiris prediction layer: first release design

Date: 2026-09-26
Status: design for review
Branch: codex/prediction-layer-design

## Intent and constraints

Improve entry and harvest decisions using Kraken microstructure and multi-horizon uncertainty while keeping the existing decision-first interface. Preserve read-only Kraken account access and the Strategy 2.1, research-integrity, liquidity, and risk gates. No order submission, editing, cancellation, withdrawal, wallet signing, or automatic trading. New predictions must earn authority through forward outcomes and cost-aware testing; missing data cannot be replaced with fabricated precision.

## Source and release boundary

The GitHub root contains an archived v0.7.6 package plus deployment overrides, not a conventional current application checkout. Before implementing, reconstruct the exact production source and compare its commit/build identity with the live deployed version. If the archive is behind the current production revision, recover the newer checkpoint and rebase the design on it. Never replace production with an older packaged source. Use an isolated branch and existing Railway release gate; promote only after candidate verification.

## Data pipeline

Collect Kraken public L2 snapshots and deltas per eligible pair, with sequence/checksum continuity where supported. Store receive and exchange timestamps, pair mapping, raw payload fingerprints, and a bounded point-in-time feature history on the persistent volume. On gaps, reconnect and resnapshot; mark the interval invalid. Private balances/orders/fills remain in the existing read-only account synchronizer, isolated from public book collection.

Compute top-of-book spread, depth at 50/100 bps, queue imbalance, microprice, depth slope and order-flow imbalance from valid book states. Add cancellation/replenishment and aggressive-trade imbalance only when the underlying event stream can distinguish them reliably. Features carry sample coverage, age, and validity. A stale, crossed, unmapped or discontinuous book supplies no prediction authority. Bound retention and writes so Railway storage and CPU remain predictable.

## Forecast and routing

Define native horizons 1H, 4H, 1D, 3D and 7D, matching outcome memory. Forecast records include model/version, prediction time, feature cut-off, base price, probability of positive return, +3% event probability, 10/50/90% return quantiles, expected net return after estimated fees/spread/impact, adverse-excursion probability, regime, and availability status. Values are nullable until a trained/calibrated model exists; never present heuristic confidence as calibrated probability.

First release uses simple, auditable trend and mean-reversion baselines plus a microstructure specialist at short horizons. A soft regime router can change their weights only after chronological validation demonstrates value against a fixed baseline. Models without enough valid data run in shadow. No foundation model, derivatives, news, lead-lag ecosystem, or reinforcement-learning decision authority in this release.

## Authority and abstention

Forecast authority is HIGH, NORMAL, LOW or ABSTAIN. Missing book continuity, insufficient independent outcomes, poor calibration, model disagreement, drift, stale inputs, or net edge below execution cost force LOW or ABSTAIN under explicit tested thresholds. Strategy 2.1 retains final hard vetoes. During shadow mode the new layer logs recommendations and counterfactuals without changing buys, sells, sizes, or UI confidence. After a holdout and live forward window, promote only the validated horizon/regime/pair segments; others remain shadow. Do not interpret ABSTAIN as a forecasting error.

## Outcomes, calibration and trials

Extend persistent outcome records with forecast IDs and immutable feature/model versions. Score matured horizons only using observations available at or after each due time, recording evaluation lag and missingness; do not mistake the next arbitrarily late snapshot for an exact horizon close. Track Brier score, calibration bins, log loss, interval coverage, and net-of-cost directional outcomes by horizon and regime, with minimum sample counts and uncertainty. Detect drift in feature distributions and scored residuals; lower authority first, then shadow-retrain and validate.

Maintain a strategy trial ledger of every attempted feature/model/parameter configuration, including failed trials, chronological train/validation/test windows, embargo, asset universe, fees, spread, impact, fill assumptions, and selected metrics. Walk-forward testing must preserve point-in-time membership and source availability; never select parameters on the final test window. Include a simple no-trade and existing Strategy 2.1 baseline. Relative ranking and portfolio dependency may be measured in shadow but receive no authority until validated.

## Product and APIs

Keep the current coin card focused on action, limit, amount, current price and a concise reason or uncertainty cue. Do not add research panels, book metrics, model weights or a forecast table to the main UI. Internal diagnostic APIs may expose forecasts, coverage, calibration and trial records to authenticated operators; sanitize account and credential data. Retain the release gate preventing verbose research text from leaking into the simplified UI.

## Failure modes and verification

A provider outage, book gap, malformed event, storage error or unavailable model degrades the prediction layer to ABSTAIN without breaking Strategy 2.1 or private account reconciliation. Test deterministic book reconstruction, stale/gap behavior, point-in-time cutoffs, costs and abstention, calibration on matured records, and shadow isolation. Run the full test suite, strict TypeScript/build, security checks for Kraken write paths, and hosted candidate gate. Inspect actual candidate data coverage and Railway storage/CPU before any production promotion.

## Deferred work

Derivatives and ETF flows, news syndication and claim deduplication, ecosystem lead-lag, cross-sectional authority, foundation-model challengers and RL execution are separate releases. They should enter as point-in-time shadow inputs and pass the same trial ledger before influencing decisions.
