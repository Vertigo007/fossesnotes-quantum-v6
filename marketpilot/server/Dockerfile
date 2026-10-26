# MarketPilot server — runs anywhere Docker runs (Render, Railway, Fly.io, a VPS).
# Node ships its own time-zone data (full ICU), so TZ works without tzdata.
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production \
    PORT=8787 \
    DATA_DIR=/data \
    TZ=America/Toronto

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY src ./src
COPY public ./public

# Listings, decisions and photos live in /data: mount a persistent disk there.
VOLUME ["/data"]
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" || exit 1
CMD ["node", "src/index.js"]
