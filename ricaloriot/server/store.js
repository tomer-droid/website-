// Where the one shared state document lives.
// In the cloud: Netlify Blobs (site-wide store, strong consistency).
// Locally (npm run dev): a JSON file.
import { readFile, writeFile } from 'node:fs/promises';
import { getStore } from '@netlify/blobs';

export class ConflictError extends Error {}

const KEY = 'state';
const LOCAL = process.env.RK_LOCAL_STORE;
const store = () => getStore({ name: 'ricaloriot', consistency: 'strong' });

// Kept between requests on a warm function instance: saves storage reads while polling.
let cache = null; // { state, etag, at }

/** -> { state, etag }. state is null only when nothing was ever saved. */
export async function readState(maxAgeMs = 0) {
  if (cache && Date.now() - cache.at < maxAgeMs) return cache;
  if (LOCAL) {
    let state = null;
    try {
      state = JSON.parse(await readFile(LOCAL, 'utf8'));
    } catch {}
    cache = { state, etag: state ? String(state.rev) : null, at: Date.now() };
    return cache;
  }
  // We pass the etag we already hold: when nothing changed, nothing is downloaded (data === null).
  const known = (cache?.state && cache.etag) || undefined;
  const res = await store().getWithMetadata(KEY, { type: 'json', etag: known });
  if (res === null) cache = { state: null, etag: null, at: Date.now() };
  else if (known && res.data === null) cache = { ...cache, at: Date.now() };
  else cache = { state: res.data, etag: res.etag || null, at: Date.now() };
  return cache;
}

/**
 * Saves `state`, which was computed from a read that returned `etag`.
 * - nothing saved yet        -> create only if still absent
 * - we hold an etag          -> replace only if nobody wrote since that read
 * - no etag, or force = true -> plain replace
 * Throws ConflictError when someone else got there first.
 */
export async function writeState(state, { etag, existed, force = false }) {
  if (LOCAL) {
    const cur = await readState(0);
    if (!force && cur.etag !== etag) throw new ConflictError();
    await writeFile(LOCAL, JSON.stringify(state));
    cache = { state, etag: String(state.rev), at: Date.now() };
    return;
  }
  const condition = !existed ? { onlyIfNew: true } : etag && !force ? { onlyIfMatch: etag } : {};
  const res = await store().setJSON(KEY, state, condition);
  if (!res.modified) {
    cache = null;
    throw new ConflictError();
  }
  cache = res.etag ? { state, etag: res.etag, at: Date.now() } : null;
}
