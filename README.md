# NIYAMNETRA AI

**AI-Powered Packaged Commodity Compliance Screening**

Scan. Extract. Validate. Review.

NIYAMNETRA AI is a decision-support prototype for **preliminary compliance screening** of packaged commodities from packaging images. It does **not** make legal or enforcement determinations. Authorized personnel remain responsible for final verification.

## Current status — Phase 1

Professional React + Vite + Tailwind frontend with:

- Landing page
- Dashboard (demo analytics + recent scans)
- New Scan (multi-image upload, quality warning UI)
- Processing pipeline UI
- Results + report preview (mock data)

OCR, Gemini, and the Express API are **not** wired yet.

## Run locally

Requires Node.js 18+.

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173).

If `vite` fails on Windows with a blocked native Rollup binary (Application Control), this repo already overrides Rollup with `@rollup/wasm-node`.

If `node` is not on PATH, install Node.js 18+ or add a local install to PATH, then rerun the commands above.

Use **Demo mode** buttons on New Scan, or open recent scans from the dashboard. No API keys are required.

## Project structure

```
niyamnetra-ai/
  frontend/          Phase 1 application
  backend/           Placeholder for later Express services
  backend/data/rules Configurable rule JSON
  .env.example       Secrets template (unused in Phase 1)
```

## Screening statuses

The product never labels a package “illegal” or “legally compliant”. Outcomes are:

- Preliminary Checks Passed
- Potential Issue Detected
- Needs Manual Review
- Critical Information Missing
