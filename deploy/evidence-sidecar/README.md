# ZOBIRIS evidence sidecar deployment

## Current v0.2 deployment

The active Dockerfile unpacks `source-v0.2.tgz.b64`, installs locked development dependencies, and runs `npm run gate` before constructing the runtime image. The runtime includes compiled source, verification scripts, and policy files. The service name may still contain `v01`; the package version is 0.2.0.

Railway uses `deploy/evidence-sidecar` as its isolated build root, `Dockerfile` as its build file, and this directory's `railway.json`. The health endpoint is `/health`. Preserve the existing private networking, operator token, and persistent volume configuration.

Both Dockerfiles pull Node 22 Bookworm Slim from `mirror.gcr.io/library/node`, matching the registry-mirror approach used by the main app. This avoids the direct Docker Hub authentication request that returned HTTP 504 during the October 9 build. The current Dockerfile uses standard syntax and does not fetch a separate Docker Hub syntax frontend. A mirror outage can still fail a build; neither build skips its release gate.

## Legacy v0.1 build

`Dockerfile.isolated` is the legacy build for the chunked `archive/part-*.b64` bundle. It verifies SHA-256 `431c418ebc7d9e0da9d9b448a6d62d54cb63972a12d8c067c2ca7d58353e1865`, extracts the archive, and runs that package's release gate. It is not the Dockerfile selected by the current v0.2 service configuration.

## Authority and validation

Authority remains `SHADOW_ONLY`; the sidecar has no exchange-write authority. The main app uses a dedicated evidence token, mapped to the sidecar's operator token. Actual-fill reconciliation must not manufacture pair provenance from normalized trade history.

Before promotion, run the package release gate and verify the Railway image build and `/health` check. A passing local gate does not prove a registry pull or Railway deployment succeeded.
