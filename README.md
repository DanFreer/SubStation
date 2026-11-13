# SubStation

Browser-only **Sublimation Print Studio**: upload artwork, set finished size and paper, tile with overlap, preview geometry, and export a multi-page PDF. No backend. Hosted as a static SPA on **GitHub Pages**.

**Live (after Pages is enabled):** https://danfreer.github.io/SubStation/

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- Lucide React
- HashRouter (GitHub Pages–friendly)
- Vitest
- pdf-lib

## Scripts

```bash
npm install
npm run dev        # http://127.0.0.1:5173/
npm run typecheck
npm run build      # local base `/`
npm test
```

GitHub Pages production build (used by Actions):

```bash
VITE_BASE_PATH=/SubStation/ npm run build
```

## Features

- Upload PNG/JPG/WebP (local only; never written to localStorage)
- Artwork size, paper presets, margins, overlap, mirror (default ON)
- Tile preview (full + per-page) driven by the same print engine as PDF
- DPI bands and validation warnings
- Multi-page PDF download/print with optional marks/labels
- Preferences persist in `localStorage` (sizes, paper, overlap, mirror, marks)

## GitHub Pages — enable once (manual)

The deploy workflow (`.github/workflows/deploy-pages.yml`) builds with base path **`/SubStation/`** and publishes `dist/` on every push to `main`. You still need to turn Pages on in the repo settings (API cannot do this without admin UI confirmation):

1. Open **https://github.com/DanFreer/SubStation/settings/pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions** (not “Deploy from a branch”)
3. Save if prompted
4. Ensure Actions are allowed for the repo (**Settings → Actions → General** → allow Actions)
5. Push to `main` (or re-run the **Deploy GitHub Pages** workflow under the Actions tab)
6. Wait for the workflow to finish, then open **https://danfreer.github.io/SubStation/**

### If the site loads but is a blank white screen

That means Pages is publishing the **repo source** (`index.html` → `/src/main.tsx`) instead of the Vite **`dist/`** build. Browsers cannot run the TypeScript entry (wrong path + `application/octet-stream` MIME). Fix: set Source to **GitHub Actions**, then re-run **Deploy GitHub Pages**. Do not use “Deploy from a branch” on `main`.

### Base path

| Environment | `VITE_BASE_PATH` | App URL |
|-------------|------------------|---------|
| Local / custom domain root | unset → `/` | `http://127.0.0.1:5173/` |
| GitHub project Pages | `/SubStation/` | `https://danfreer.github.io/SubStation/` |

Routing uses **HashRouter** (`#/...`) so deep links work without a server rewrite.

### Print tip

When printing the PDF, set scale to **Actual Size / 100%** (disable Fit to page).

## Remote

```bash
git remote add origin https://github.com/DanFreer/SubStation.git
git push -u origin main
```
