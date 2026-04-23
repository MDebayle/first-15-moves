# The First 15 Moves

A gentle, browser-based trainer that teaches the first fifteen moves of chess — both the openings themselves and the classical principles that make them work (center control, development, king safety, tempo).

The frontend is **fully static**: plain HTML, CSS, and ES modules. No build step, no framework tax. Drop it on Netlify and it just runs. A small Node/Express backend (in `server/`) wraps a persistent Stockfish process for fast, consistent analysis — deployed to Render as a Docker image.

**👉 New here? Start with [`SETUP.md`](./SETUP.md) — a click-by-click walkthrough for GitHub, Render, and Netlify.**

---

## How it works

Three little systems, each doing one job:

| Layer            | Library          | Role                                                       |
| ---------------- | ---------------- | ---------------------------------------------------------- |
| Rules & state    | [chess.js]       | Move legality, FEN/SAN, game-over detection                |
| Board UI         | [cm-chessboard]  | Lightweight SVG board with drag & click input              |
| Analysis engine  | [Stockfish] (server-side on Render, browser fallback) | Centipawn evaluation and best-move search |
| Opening tree     | `data/openings.js` | Hand-authored mainline + alternatives + warm explanations |
| Critique engine  | `js/critique.js` | Combines theory, engine, and concept scores into a verdict |

[chess.js]: https://github.com/jhlywa/chess.js
[cm-chessboard]: https://github.com/shaack/cm-chessboard
[Stockfish]: https://stockfishchess.org/

The engine lives on the server by default (better performance, no device variability, deeper analysis on demand). If `API_BASE` in `js/config.js` is blank or the backend is unreachable, the frontend automatically falls back to running Stockfish in a browser Web Worker. **The lesson defines the path; the engine just checks the math.**

---

## Openings included (v1)

- Italian Game
- Queen's Gambit Declined
- London System

Each has a curated mainline through roughly move 15, plus annotated alternatives for common deviations. Adding openings is just a matter of adding a new entry to `data/openings.js` — see the existing ones as templates.

---

## Run it locally

The site is static, but because it uses ES modules it needs to be served over `http://`, not `file://`. Any static server will do:

```bash
cd first-15-moves
python3 -m http.server 8787
# then open http://localhost:8787
```

---

## Deploy

See **[`SETUP.md`](./SETUP.md)** for the full click-by-click walkthrough. Short version:

1. Push the repo to GitHub.
2. In Render: **New → Blueprint → pick repo**. `server/render.yaml` is detected. Wait ~4 min. Copy the resulting URL.
3. Paste that URL into `js/config.js` → `API_BASE`. Commit and push.
4. In Netlify: **Add new site → Import → pick repo**. Deploy.
5. Set `ALLOWED_ORIGINS` on Render to your Netlify URL.

Every future `git push` redeploys both.

---

## Project structure

```
first-15-moves/
├── index.html                # Page shell + panels
├── netlify.toml              # Netlify publish config + cache headers
├── SETUP.md                  # Click-by-click deploy guide
├── css/
│   └── styles.css            # Design tokens, layout, coach panel
├── js/
│   ├── app.js                # Main controller
│   ├── config.js             # Runtime config (API base URL, depth)
│   ├── engine.js             # Remote API client + browser-WASM fallback
│   └── critique.js           # Theory + engine + concept scoring
├── data/
│   └── openings.js           # Opening trees (mainlines + alternatives)
├── server/                   # Render-hosted backend
│   ├── Dockerfile            # Node 20 + Stockfish
│   ├── render.yaml           # One-click Render deploy
│   └── src/
│       ├── index.js          # Express API
│       └── stockfish.js      # Persistent engine process manager
└── vendor/                   # Third-party libraries, vendored
    ├── chess.js              # Move rules
    ├── cm-chessboard/        # Board UI (trimmed to essentials)
    └── stockfish/            # Browser fallback engine + GPLv3 license
```

---

## Licenses

- This project's own source: MIT (feel free to use).
- **Stockfish is GPLv3.** A copy of the license ships at `vendor/stockfish/Copying.txt`. The engine binary is loaded client-side as a Web Worker; we're distributing it, so we comply by including the license and by linking to the upstream project in the site footer.
- `chess.js` — BSD 2-clause.
- `cm-chessboard` — MIT.

If you later move Stockfish to a server-side binary (see the "Upgrade path" below), revisit the license implications — the GPL's distribution conditions mostly go away when you don't ship the binary to users.

---

## Architecture notes

**Why server-side Stockfish?** Consistent strength across devices, no mobile battery drain, deeper analysis on demand, and cleaner GPL handling (the binary stays on the server). **Why also a browser fallback?** So local dev and offline mode both just work, and so a temporary backend hiccup doesn't break the site.

**Cost**: $0 for GitHub + Netlify, $7/mo for the Render starter plan (which stays awake — no cold starts). Total: **$7/mo**.

---

## Roadmap

- More openings (Ruy Lopez, Caro-Kann, King's Indian, Sicilian starter).
- Switch sides — let the student play Black against selected openings.
- Session persistence across reloads.
- Spaced-repetition drill of weak spots.
- Render-hosted engine for deeper analysis.
