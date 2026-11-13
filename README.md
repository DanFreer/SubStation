# SubStation

Browser-only **Sublimation Print Studio**: upload artwork, set finished size and paper, tile with overlap, preview geometry, and export a multi-page PDF. No backend. Hosted as a static SPA on **GitHub Pages**.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- Lucide React
- HashRouter (GitHub Pages–friendly)
- Vitest (engine tests from Stage 2+)
- pdf-lib (PDF export from Stage 4)

## GitHub Pages / routing

- **Router:** `HashRouter` so deep links work without a server rewrite.
- **Base path:** for project pages, build with:

  ```bash
  VITE_BASE_PATH=/SubStation/ npm run build
  ```

  Locally and on a custom domain root, omit `VITE_BASE_PATH` (defaults to `/`).

## Scripts

```bash
npm install
npm run dev        # http://127.0.0.1:5173/
npm run typecheck
npm run build
npm test
```

## Stage 1 scope

Three-panel shell, image upload, artwork dimensions, paper presets. Tiling engine, preview overlays, and PDF come in later stages.

## Remote

```bash
git remote add origin https://github.com/DanFreer/SubStation.git
git push -u origin main
```
