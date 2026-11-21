# Ricaloriot

A small phone app (PWA, Hebrew) that answers one question for two people at once:
**how many calories and how much protein are left to eat today — and what could be cooked with that.**

- **Today** – what is left (calories + protein), a plain-language hint, quick logging.
- **Suggestions** – meal ideas grouped by calorie level (about 300 / 400 / 500 …), each with protein and fat.
- **List** – how much is in every food (calories, protein, fat); tap + to put a meal together and see its total.

Both phones see the same data live (the app polls a tiny API).

## How it is built

| Path | What |
| --- | --- |
| `public/` | The app itself: plain HTML/CSS/ES modules, no build step |
| `public/ops.js` | The shared-state logic, used by both the browser and the API |
| `public/foods.js` | Built-in foods and meal ideas |
| `server/state.js` | `GET`/`POST` the shared state (one JSON document) |
| `server/store.js` | Where that document lives: Netlify Blobs in the cloud, a JSON file locally |
| `server/manifest.js` | Web-app manifest |
| `netlify/functions/` | Thin Netlify wrappers that expose the two handlers at `/api/*` |
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

Deployed on Netlify as the site `ricaloriot` (https://ricaloriot.netlify.app), from this folder:
static files from `public/`, the API as Netlify Functions, data in Netlify Blobs
(store `ricaloriot`, key `state`).

One thing is configured on the Netlify site, never in this repository:

- the environment variable `RICALORIOT_CODE` - the access code both phones use

This folder is not part of the company website: `firebase.json` ignores it.
