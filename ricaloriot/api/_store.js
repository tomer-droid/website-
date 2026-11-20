// Where the one shared state document lives.
// In the cloud: a private Vercel Blob. Locally (npm run dev): a JSON file.
import { readFile, writeFile } from 'node:fs/promises';
import { get, put, BlobPreconditionFailedError } from '@vercel/blob';

export class ConflictError extends Error {}

const PATH = 'state.json';
const LOCAL = process.env.RK_LOCAL_STORE;

// Kept between requests on a warm function instance: saves storage reads while polling.
let cache = null; // { state, etag, at }

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
  // useCache:false -> always the latest version; ifNoneMatch -> nothing is downloaded when unchanged
  const res = await get(PATH, { access: 'private', useCache: false, ifNoneMatch: cache?.etag || undefined });
  if (!res) cache = { state: null, etag: null, at: Date.now() };
  else if (res.statusCode === 304) cache = { ...cache, at: Date.now() };
  else cache = { state: JSON.parse(await new Response(res.stream).text()), etag: res.blob.etag, at: Date.now() };
  return cache;
}

/** Writes only if nobody else wrote since `etag` was read; otherwise throws ConflictError. */
export async function writeState(state, etag) {
  if (LOCAL) {
    const cur = await readState(0);
    if (cur.etag !== etag) throw new ConflictError();
    await writeFile(LOCAL, JSON.stringify(state));
    cache = { state, etag: String(state.rev), at: Date.now() };
    return;
  }
  try {
    const res = await put(PATH, JSON.stringify(state), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      ...(etag ? { allowOverwrite: true, ifMatch: etag } : {}),
    });
    cache = res.etag ? { state, etag: res.etag, at: Date.now() } : null;
  } catch (e) {
    cache = null;
    if (e instanceof BlobPreconditionFailedError || /already exists|precondition/i.test(e?.message || '')) {
      throw new ConflictError();
    }
    throw e;
  }
}
