# The First 15 Moves — Backend API

A tiny Node/Express service that wraps a persistent Stockfish process and exposes two endpoints for the Netlify frontend.

## Endpoints

| Method | Path              | Body                         | Returns                                       |
| ------ | ----------------- | ---------------------------- | --------------------------------------------- |
| GET    | `/api/health`     | —                            | `{ ok, engineReady, queued, now }`            |
| POST   | `/api/analyze`    | `{ fen, depth?, movetime? }` | `{ bestmove, info: { depth, scoreCp, pv } }`  |
| POST   | `/api/bestmove`   | `{ fen, depth? }`            | `{ bestmove }`                                |

`depth` is clamped to 1–20. `movetime` (ms) is clamped to 10–3000.

## Environment

| Variable            | Default       | Purpose                                                 |
| ------------------- | ------------- | ------------------------------------------------------- |
| `PORT`              | `8080`        | HTTP port (Render sets this automatically).             |
| `ALLOWED_ORIGINS`   | `*`           | Comma-separated CORS allow-list (set to Netlify URL).   |
| `RATE_LIMIT`        | `60`          | Requests per minute per IP.                             |
| `STOCKFISH_BINARY`  | `stockfish`   | Engine binary name — leave as default in Docker.        |

## Local run

Requires Node 20+ and a Stockfish binary on your `PATH`.

```bash
# macOS:   brew install stockfish
# Ubuntu:  sudo apt-get install stockfish

cd server
npm install
npm run dev     # http://localhost:8080
```

Quick test:

```bash
curl -s http://localhost:8080/api/health
curl -s -X POST http://localhost:8080/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"fen":"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1","depth":10}'
```

## Deploy to Render

See the top-level `SETUP.md` for the click-by-click walkthrough. The TL;DR:

1. Push this repo to GitHub.
2. In Render → New → Blueprint → pick the repo. `render.yaml` is detected automatically.
3. Set `ALLOWED_ORIGINS` to your Netlify site URL after the frontend deploys.

The service uses the `starter` plan ($7/month) — it stays awake so there are no cold starts and move analysis is instant.
