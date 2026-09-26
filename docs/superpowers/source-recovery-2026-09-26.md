# Prediction shadow source recovery and release

Production deployment: 9deb5f37-067d-4c6a-9b49-735fe59d10cb (SUCCESS), commit 16f6c63584782791bd4f4bc34b0e2218a5a7fd03.

The source archive in deploy/v076 reconstructs to SHA-256 fd32f772482562ad7ce8597d7ff3e3fc318dd7d7f5cfb6ff1d376a599218f4f7, matching its manifest. The Dockerfile applies v076 overrides, production patch, audit fixes, then deploy/prediction/overrides. The latter adds the prediction shadow files and modifies only the server route/startup and hosted gate; it does not alter Strategy 2.1 decision logic or the UI.

Local baseline: 474/474 tests, strict TypeScript and UI build passed. Candidate: 491/491 tests, 218/218 Strategy 2.1 tests, strict TypeScript and UI build passed. The new collector remains opt-in with ZOBIRIS_PREDICTION_SHADOW=1. It subscribes to public BTC/USD and SOL/USD by default; no private Kraken credentials are read by this collector. Forecasts are uncalibrated, remain ABSTAIN, and have nullable probabilities. The operator diagnostic endpoint requires the existing refresh token. Production promotion requires the hosted candidate gate and observed book coverage/resource checks.

Rulings: Kraken spot WebSocket v2 provides per-update CRC32 rather than numeric sequence; the reducer validates CRC32 and resnapshots after mismatch. The trial ledger lives in src/server because the Strategy 2.1 TypeScript rootDir excludes server storage code. No trained multi-horizon probabilities or decision authority are claimed in this release.
