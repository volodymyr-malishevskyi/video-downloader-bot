# Base
FROM node:22-slim AS base

WORKDIR /app

# Builder
FROM base AS builder

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runner
FROM base AS runner

LABEL org.opencontainers.image.source=https://github.com/volodymyr-malishevskyi/video-downloader-bot

RUN apt-get update && apt-get install gnupg wget -y && \
    wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    apt-get update && \
    apt-get install google-chrome-stable -y --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

USER node

COPY --from=builder /app .

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

ENV NODE_ENV=production
CMD ["node", "dist/app.js"]