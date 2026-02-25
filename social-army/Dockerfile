# ─── Social Army Worker ───────────────────────────────────
# Runs on Railway as a persistent background service.
# Uses Puppeteer (system Chromium) for platform automation.
#
# Env vars required (set in Railway dashboard):
#   NEXT_PUBLIC_SUPABASE_URL
#   SUPABASE_SERVICE_ROLE_KEY
#   GFX_TOOLZ_USER  / GFX_TOOLZ_PASS   (optional, falls back to Gemini)
#   GEMINI_API_KEY                       (optional)
#   OPENAI_API_KEY                       (optional)
#   WORKER_CONCURRENCY                   (default 10)
#   BROWSER_POOL_SIZE                    (default 10)
#   PORT                                 (Railway injects this; used by health server)

FROM node:20-slim

# System deps for Chromium + canvas
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libgbm1 \
    libgtk-3-0 \
    libnss3 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Point Puppeteer at system Chromium (no 300 MB download)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Install Node deps first for layer-cache efficiency
COPY social-army/package.json social-army/package-lock.json* ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy all source
COPY social-army/ .

# Lightweight HTTP health-check server (Railway needs a live port)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -sf http://localhost:${PORT:-3001}/health || exit 1

EXPOSE 3001

CMD ["npx", "tsx", "src/worker.ts"]

