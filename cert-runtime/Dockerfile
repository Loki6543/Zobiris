FROM node:24-bookworm-slim
WORKDIR /app
COPY server.mjs /app/server.mjs
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node", "server.mjs"]
