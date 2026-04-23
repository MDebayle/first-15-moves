FROM node:20-slim

# Install Stockfish from Debian repos — small, stable, maintained.
# Debian puts the binary at /usr/games/stockfish which isn't on the default PATH,
# so we symlink it into /usr/local/bin so `spawn("stockfish")` can find it.
RUN apt-get update \
    && apt-get install -y --no-install-recommends stockfish ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/games/stockfish /usr/local/bin/stockfish

WORKDIR /app

# Copy manifests first for layer caching
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "src/index.js"]
