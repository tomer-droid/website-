# Ricaloriot

A small phone app (PWA, Hebrew) that answers one question for two people at once:
**how many calories and how much protein are left to eat today — and what could be cooked with that.**

- **Today** – what is left (calories + protein), a plain-language hint, quick logging.
- **Ideas** – meal ideas that fit the remaining budget.
- **Foods** – a calorie reference list that doubles as a meal builder.

Both phones see the same data live (the app polls a tiny API).

## How it is built

| Path | What |
| --- | --- |
| `public/` | The app itself: plain HTML/CSS/ES modules, no build step |
| `public/ops.js` | The shared-state logic, used by both the browser and the API |
| `public/foods.js` | Built-in foods and meal ideas |
| `api/state.js` | `GET`/`POST` the shared state (one JSON document in a private Vercel Blob) |
| `api/manifest.js` | Web-app manifest |
| `dev-server.mjs` | Local preview against a local JSON file |

### Food data rule

A calorie value is hard-coded in `public/foods.js` only when it is a stable, generic fact
(an egg, olive oil, cooked rice). Anything that depends on brand, fat percentage or size
(bread, yellow cheese, cottage, tortilla…) is left empty on purpose; it is filled in once
inside the app from the package label and saved in the shared state.

## Run locally

```bash
npm install
npm run dev   # http://localhost:5173/?k=123456
```

## Hosting

Deployed on Vercel as the project `ricaloriot` (root directory: `ricaloriot/`).
It needs two things configured in the Vercel project, never in this repository:

- a private Blob store connected to the project (provides `BLOB_READ_WRITE_TOKEN`)
- the environment variable `RICALORIOT_CODE` – the access code both phones use

This folder is not part of the company website: `firebase.json` ignores it.
