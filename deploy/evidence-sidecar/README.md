# ZOBIRIS evidence sidecar deployment

This directory deploys the user-supplied zobiris-evidence v0.1 package as a separate Railway service.

The package is stored as deterministic base64 chunks of a tar.xz archive because the deployment bundle arrived as a conversation attachment rather than a Git repository tree. The wrapper Dockerfile concatenates the chunks, verifies SHA-256 431c418ebc7d9e0da9d9b448a6d62d54cb63972a12d8c067c2ca7d58353e1865, extracts it, runs the package own npm run gate, and only then creates the runtime image.

Authority remains SHADOW_ONLY. The main ZOBIRIS service reports fully unblocked live entry plans to this service; failures never change the production recommendation. A dedicated ZOBIRIS_EVIDENCE_TOKEN is used by the main app and maps to ZOBIRIS_OPERATOR_TOKEN only inside the sidecar.

Actual-fill reconciliation is intentionally not auto-wired in this integration because the current normalized Kraken trade-history record does not preserve enough verified pair provenance to safely manufacture a Kraken WebSocket pair.

Railway service configuration uses the repository root as build context with `deploy/evidence-sidecar/Dockerfile` selected explicitly, a private `zobiris-evidence` endpoint, one `us-west2` replica, and a dedicated `/data` volume.

The Railway service uses `/deploy/evidence-sidecar` as an isolated monorepo root and `Dockerfile.isolated` as its Dockerfile, preventing the repository-level main-app `railway.json` from applying to this sidecar.
