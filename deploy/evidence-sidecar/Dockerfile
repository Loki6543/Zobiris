FROM node:22-bookworm-slim AS unpack
RUN apt-get update && apt-get install -y --no-install-recommends xz-utils ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /work
COPY deploy/evidence-sidecar/archive ./archive
RUN cat archive/part-*.b64 | base64 -d > /tmp/zobiris-evidence.tar.xz \\
 && echo "431c418ebc7d9e0da9d9b448a6d62d54cb63972a12d8c067c2ca7d58353e1865  /tmp/zobiris-evidence.tar.xz" | sha256sum -c - \\
 && mkdir -p /src \\
 && tar -xJf /tmp/zobiris-evidence.tar.xz -C /src \\
 && test -f /src/zobiris-evidence/package-lock.json

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=unpack /src/zobiris-evidence/package.json /src/zobiris-evidence/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY --from=unpack /src/zobiris-evidence/ ./
RUN npm run gate

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/dist/src ./dist/src
COPY --from=build /app/policy ./policy
EXPOSE 8080
CMD ["node", "dist/src/index.js"]
