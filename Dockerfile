FROM mirror.gcr.io/library/node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ xz-utils \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY deploy/v076/ /tmp/zobiris-b64/
RUN cat /tmp/zobiris-b64/*.b64 | base64 -d > /tmp/zobiris.txz \
  && tar -xJf /tmp/zobiris.txz -C /tmp \
  && cp -a /tmp/Zobiris_v0.7.6_Railway_Staging/. /app/ \
  && mkdir -p /app/docs \
  && cp /tmp/zobiris-b64/ATTENTION_SNAPSHOT_LEDGER_V073.md /app/docs/ATTENTION_SNAPSHOT_LEDGER_V073.md \
  && cp -a /tmp/zobiris-b64/overrides/. /app/ \
  && rm -rf /tmp/zobiris-b64 /tmp/zobiris.txz /tmp/Zobiris_v0.7.6_Railway_Staging

COPY railway_hosted_gate.mjs /app/scripts/railway_hosted_gate.mjs
COPY railway_persistence_wrapper.mjs /app/scripts/railway_persistence_wrapper.mjs

RUN node scripts/v076_patch_production.mjs \
  && cp -r audit-fixes/. /app/ \
  && rm -rf audit-fixes
COPY deploy/prediction/overrides/. /app/
COPY deploy/p0/overrides/. /app/
COPY deploy/dashboard/overrides/. /app/
COPY deploy/protection/overrides/. /app/
# Keep the root hosted gate canonical; prediction overlays must not silently replace release policy.
COPY railway_hosted_gate.mjs /app/scripts/railway_hosted_gate.mjs

RUN npm ci --no-audit --no-fund
RUN npx tsc -p packages/research-p0/tsconfig.json \
  && (cd packages/research-p0 && node dist/scripts/selftest.js) \
  && npm run test:decision-boundary \
  && npm run test:same-origin-refresh \
  && node --experimental-strip-types --test verification/cmcKeylessCurrentShape.node.test.mjs \
  && node --experimental-strip-types --test verification/cmcQuoteShape.node.test.mjs \
  && npm run test:strategy21 \
  && npm test \
  && npx tsc -p tsconfig.production.json --noEmit \
  && npm run build:ui \
  && mkdir -p /data \
  && chown -R node:node /data

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    ZOBIRIS_DB_PATH=/data/zobiris.sqlite \
    ZOBIRIS_ALLOW_ANONYMOUS_REFRESH=0 \
    ZOBIRIS_ALLOW_SAME_ORIGIN_REFRESH=0 \
    ZOBIRIS_ALLOW_LIVE_PROVIDERS=0 \
    ZOBIRIS_ATTENTION_COLLECT_ON_REFRESH=0 \
    ZOBIRIS_STRATEGY21_AUTO_COLLECT=0

USER node
EXPOSE 3000
CMD ["node", "--import", "tsx", "src/server/server.ts"]
