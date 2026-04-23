# Setup Guide — The First 15 Moves

This walks you through everything, in order, click by click. Read top to bottom once before starting so you know the shape of it, then go back and do each step.

Total time: **~30 minutes** of actual clicking, most of which is waiting for builds.

---

## What you're building

```
┌──────────────────────┐        HTTPS         ┌─────────────────────────┐
│  Netlify (frontend)  │ ───────────────────▶ │  Render (backend API)   │
│  • index.html        │                      │  • Node + Express       │
│  • css / js / data   │                      │  • Persistent Stockfish │
│  • vendored libs     │                      │                         │
└──────────────────────┘                      └─────────────────────────┘
         ▲                                               ▲
         │                                               │
         └─────────────── GitHub (source of truth) ──────┘
                       (one repo powers both)
```

One GitHub repo. Netlify auto-deploys the static site when you push. Render auto-deploys the backend when you push. Once set up, every change you make is just `git push` and both services update themselves.

---

## Part 1 — GitHub (10 minutes)

You said you created a GitHub account yesterday — good. Let's confirm a few things, then get the code up there.

### 1.1 Confirm your local git identity

Open a terminal (on macOS: Terminal.app; on Windows: Git Bash) and run:

```bash
git config --global user.name
git config --global user.email
```

If either is blank, set them (use the email attached to your GitHub account):

```bash
git config --global user.name "Marcel Debayle"
git config --global user.email "marcel.debayle@gmail.com"
```

### 1.2 Make sure you have an SSH key or are using HTTPS

Two ways to push to GitHub: SSH keys (one-time setup, never type a password) or HTTPS + personal access token. For a first-timer, **HTTPS with GitHub's CLI helper is easiest.**

- **Easy path (recommended):** install [GitHub CLI](https://cli.github.com/) (`brew install gh` on macOS, `winget install GitHub.cli` on Windows). Then run `gh auth login` and follow the prompts — pick "GitHub.com", then "HTTPS", then "Login with a web browser". It opens GitHub, you click "Authorize", done. You never have to think about credentials again.
- **Alternative:** set up an [SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh). More work up front, but rock-solid long-term.

### 1.3 Create the repository

1. Unzip the project (`first-15-moves.zip`) somewhere sensible — e.g. `~/Projects/first-15-moves`.
2. Open a terminal in that folder: `cd ~/Projects/first-15-moves`.
3. Initialize git and commit:

   ```bash
   git init
   git add .
   git commit -m "Initial prototype of The First 15 Moves"
   git branch -M main
   ```

4. Create the GitHub repo. Easiest way (if you did `gh auth login` above):

   ```bash
   gh repo create first-15-moves --public --source=. --remote=origin --push
   ```

   That one command creates the repo on GitHub, sets it as your `origin`, and pushes in one shot.

   **Or** the manual way: go to [github.com/new](https://github.com/new), name it `first-15-moves`, leave it empty (don't add a README or license — we already have one), click Create. Then back in your terminal:

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/first-15-moves.git
   git push -u origin main
   ```

5. Refresh the GitHub page. You should see all your files.

### 1.4 One daily-life command to remember

From now on, whenever you change the code:

```bash
git add .
git commit -m "short description of what changed"
git push
```

That's it. Both Netlify and Render will notice and redeploy automatically.

---

## Part 2 — Render (10 minutes, $7/mo)

This is where the backend lives. We'll deploy the `server/` folder to Render, and Render will build a Docker image with Node + Stockfish and keep it running 24/7.

### 2.1 Create your Render account

1. Go to [render.com](https://render.com) and click **Get Started**.
2. Sign up with GitHub (this way Render can see your repos automatically).
3. Render will ask for permission to see your repositories — click **Authorize Render**.

### 2.2 Add a payment method

Before deploying, you need to add a card. Render has a free tier, but we want the **Starter plan ($7/mo)** because it stays awake — the free tier sleeps after 15 minutes of inactivity and takes ~30 seconds to wake up, which would make your site feel broken to a first-time visitor.

1. In the Render dashboard, click your profile (top-right) → **Billing**.
2. Click **Add Payment Method** and enter a credit card.
3. You won't be charged until you create a paid service.

### 2.3 Deploy the backend with one click

1. In the Render dashboard, click **New +** → **Blueprint**.
2. Select the `first-15-moves` repo.
3. Render will detect `server/render.yaml` automatically and show a preview: **first-15-moves-api**, plan **starter**, runtime **docker**.
4. Click **Apply**.
5. Render will now build the Docker image. This takes about **3-5 minutes** the first time because it installs Stockfish inside the image. You'll see build logs streaming. Wait until the status becomes **Live**.

   ⚠️ **If the build fails** and the error mentions `dockerContext`, double-check that the service is pointing at the `server/` folder, not the repo root. You can edit this in the service's **Settings** → **Build & Deploy** → **Root Directory** should be `server`.

6. Once Live, click on the service name. At the top you'll see the public URL, something like `https://first-15-moves-api-abcd.onrender.com`. **Copy this URL — you need it in Part 3.**

7. Test it. Paste this in your browser, replacing the URL:

   ```
   https://first-15-moves-api-abcd.onrender.com/api/health
   ```

   You should see JSON like `{"ok":true,"engineReady":true,…}`. If you do — the backend is live.

### 2.4 Set the CORS allow-list (do this AFTER Part 3)

Come back to this step once you have your Netlify URL. For now, the backend allows any origin, which is fine for testing but you'll want to lock it down once the frontend is live:

1. In Render → your service → **Environment** tab.
2. Find `ALLOWED_ORIGINS` (it's defined in `render.yaml` with `sync: false`, meaning Render won't auto-set it).
3. Click **Add Environment Variable**, key = `ALLOWED_ORIGINS`, value = your Netlify URL(s) comma-separated, e.g. `https://first-15-moves.netlify.app`.
4. Save. Render will redeploy automatically (~1 minute).

---

## Part 3 — Netlify (5 minutes, free)

Netlify hosts the static frontend (HTML/CSS/JS). You already know Netlify from `luxuryhotelatlas.netlify.app`, so this will feel familiar.

### 3.1 Point the frontend at your Render backend

Before you deploy, open `js/config.js` in the project. Change:

```js
API_BASE: "",
```

to your Render URL (from step 2.3):

```js
API_BASE: "https://first-15-moves-api-abcd.onrender.com",
```

Save, then commit and push:

```bash
git add js/config.js
git commit -m "Wire frontend to Render backend"
git push
```

### 3.2 Connect Netlify to the repo

1. Go to [app.netlify.com](https://app.netlify.com) and log in.
2. Click **Add new site** → **Import an existing project**.
3. Pick **GitHub** as the provider. Authorize if prompted.
4. Select your `first-15-moves` repo.
5. Netlify will read `netlify.toml` and pre-fill everything:
   - **Build command**: (blank)
   - **Publish directory**: `.`
6. Click **Deploy site**.
7. Wait ~30 seconds. When the status says **Published**, click the URL at the top — something like `https://clever-panda-abc123.netlify.app`.

### 3.3 (Optional) Rename the site

The auto-generated URL is ugly. Fix it:

1. In Netlify → your site → **Site settings** → **Change site name**.
2. Enter something clean: e.g. `first-15-moves` → becomes `https://first-15-moves.netlify.app`.

### 3.4 Lock down CORS on the backend

Now that you have your real Netlify URL, go back to **Part 2.4** and set `ALLOWED_ORIGINS` on Render.

---

## Part 4 — Smoke test

1. Open your Netlify URL in a browser.
2. Pick the Italian Game.
3. Make a move. You should see "Ready when you are." in the coach status (meaning it's talking to Render, not falling back to the browser engine).
4. Try a deliberate blunder — e.g. pick the Italian, play `Qh5` on move 2. The coach should classify it as a Mistake with warm but honest feedback.

If all that works — **you're live.** Share the URL with friends.

---

## Troubleshooting

**"The coach status says 'Ready — running locally.' instead of 'Ready when you are.'"**
That means the frontend couldn't reach your Render backend and fell back to browser-WASM. Common causes:
- You forgot to update `js/config.js` with the Render URL (step 3.1).
- You typo'd the URL.
- The Render service is down — check its status in the Render dashboard.
- CORS is blocking — open your browser DevTools console and look for CORS errors. Fix `ALLOWED_ORIGINS` on Render.

**Render build fails with "No Dockerfile found"**
Your service's root directory isn't pointing at `server/`. In Render → service → Settings → Build & Deploy → set **Root Directory** to `server`.

**Netlify deploy succeeds but site shows a 404**
Publish directory is wrong. Should be `.` (the repo root). Check `netlify.toml` or the Netlify UI → Build settings.

**"I pushed a change but Netlify / Render didn't redeploy"**
- Check the service's recent deploys — sometimes it's just queued.
- Make sure you pushed to the `main` branch (both services default to that).
- Check the service's settings — "Auto-deploy" should be on.

**The backend suddenly stopped working**
On Render free tier this would mean it went to sleep. On the starter plan we picked, it stays awake — so this shouldn't happen. If it does, the Render dashboard will show the service status and the last deploy logs. Rolling back to the previous deploy is one click.

---

## Cost recap

| Service  | Plan     | Monthly |
|----------|----------|---------|
| GitHub   | Free     | $0      |
| Netlify  | Free     | $0      |
| Render   | Starter  | $7      |
| **Total**|          | **$7**  |

Netlify's free tier gives you 100 GB of bandwidth/month — plenty for an early-stage site. Render's starter gives you 512MB RAM and 0.5 CPU, which is plenty for Stockfish at the depths we use.
