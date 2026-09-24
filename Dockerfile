FROM node:24-bookworm-slim

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
  && rm -rf /tmp/zobiris-b64 /tmp/zobiris.txz /tmp/Zobiris_v0.7.6_Railway_Staging

COPY railway_hosted_gate.mjs /app/scripts/railway_hosted_gate.mjs
COPY railway_persistence_wrapper.mjs /app/scripts/railway_persistence_wrapper.mjs

RUN npm ci --no-audit --no-fund
RUN npm run test:decision-boundary \
  && npm run test:same-origin-refresh \
  && npm run test:strategy21 \
  && npm test \
  && npm run typecheck \
  && npm run build:ui \
  && mkdir -p /data \
  && chown -R node:node /data

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    ZOBIRIS_DB_PATH=/data/zobiris.sqlite \
    ZOBIRIS_ALLOW_ANONYMOUS_REFRESH=0 \
    ZOBIRIS_ALLOW_LIVE_PROVIDERS=0 \
    ZOBIRIS_STRATEGY21_AUTO_COLLECT=0

USER node
EXPOSE 3000
CMD ["node", "--import", "tsx", "src/server/server.ts"]
