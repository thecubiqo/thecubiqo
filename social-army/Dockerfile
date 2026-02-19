# ─── Social Army Worker ───────────────────────
# Runs on Railway as a persistent background service
# Uses Puppeteer (headless Chrome) for GFXToolz automation

FROM node:20-slim

# Install Chrome dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use system Chromium (don't download its own)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files first (for layer caching)
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source code
COPY . .

# Health check (optional: curl a status endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s \
    CMD node -e "console.log('alive')" || exit 1

# Start the worker
CMD ["npx", "tsx", "src/worker.ts"]
