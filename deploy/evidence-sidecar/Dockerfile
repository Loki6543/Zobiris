FROM mirror.gcr.io/library/node:22-bookworm-slim AS build
WORKDIR /app

# Repository-friendly source bundle. The bundle is the checksum-verified v0.2
# package from the ZOBIRIS v3.1 handoff; build fails unless its own 99-test
# release gate and SHADOW_ONLY authority checks pass.
COPY source-v0.2.tgz.b64 /tmp/source.tgz.b64
RUN base64 -d /tmp/source.tgz.b64 > /tmp/source.tgz \
  && tar -xzf /tmp/source.tgz -C /app \
  && rm /tmp/source.tgz /tmp/source.tgz.b64

RUN npm ci --no-audit --no-fund
RUN npm run gate

FROM mirror.gcr.io/library/node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/dist/src ./dist/src
COPY --from=build /app/dist/scripts ./dist/scripts
COPY --from=build /app/policy ./policy
EXPOSE 8080
CMD ["node", "dist/src/index.js"]
