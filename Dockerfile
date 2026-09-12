FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends unzip python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Zobiris_v0.6.3_Railway_Staging_Package.zip /tmp/zobiris.zip
RUN unzip -q /tmp/zobiris.zip -d /tmp/zobiris \
  && cp -a /tmp/zobiris/Zobiris_v0.6.3_Railway_Staging/. /app/ \
  && rm -rf /tmp/zobiris /tmp/zobiris.zip

RUN npm ci --no-audit --no-fund
RUN npm run build:ui \
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
