// GET  /api/state?rev=N  -> the shared state (204 when the caller is already up to date)
// POST /api/state {ops}  -> apply changes, return the new state
// Every request must carry the access code in the x-rk-code header.
import { createHash, timingSafeEqual } from 'node:crypto';
import { applyOps, emptyState } from '../public/ops.js';
import { readState, writeState, ConflictError } from './_store.js';

const sha = (s) => createHash('sha256').update(String(s)).digest();
const noStore = { 'cache-control': 'no-store' };
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...noStore },
  });

// best-effort brake on guessing the code (per warm instance)
const fails = new Map();
const MAX_FAILS = 8;
const WINDOW_MS = 10 * 60e3;

export default {
  async fetch(request) {
    try {
      const expected = process.env.RICALORIOT_CODE;
      if (!expected) return json({ error: 'not_configured' }, 500);

      const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
      const now = Date.now();
      const f = fails.get(ip);
      if (f && f.until > now && f.n >= MAX_FAILS) return json({ error: 'too_many_attempts' }, 429);
      if (!timingSafeEqual(sha(request.headers.get('x-rk-code') || ''), sha(expected))) {
        const cur = f && f.until > now ? f : { n: 0, until: now + WINDOW_MS };
        cur.n += 1;
        if (fails.size > 5000) fails.clear();
        fails.set(ip, cur);
        return json({ error: 'unauthorized' }, 401);
      }

      if (request.method === 'GET') {
        const { state } = await readState(2000);
        const rev = Number(new URL(request.url).searchParams.get('rev'));
        if (state && rev === state.rev) return new Response(null, { status: 204, headers: noStore });
        return json(state || emptyState());
      }

      if (request.method === 'POST') {
        const text = await request.text();
        if (text.length > 100_000) return json({ error: 'too_large' }, 413);
        let ops;
        try {
          ops = JSON.parse(text).ops;
        } catch {
          return json({ error: 'bad_json' }, 400);
        }
        if (!Array.isArray(ops) || ops.length > 300) return json({ error: 'bad_ops' }, 400);
        for (let attempt = 0; attempt < 6; attempt++) {
          const { state, etag } = await readState(0);
          const next = applyOps(structuredClone(state || emptyState()), ops);
          next.rev = (state?.rev || 0) + 1;
          next.updatedAt = Date.now();
          try {
            await writeState(next, etag);
            return json(next);
          } catch (e) {
            if (!(e instanceof ConflictError)) throw e; // someone else wrote first: re-read and retry
          }
        }
        return json({ error: 'busy' }, 503);
      }

      return json({ error: 'method_not_allowed' }, 405);
    } catch (e) {
      console.error(e);
      return json({ error: 'server_error' }, 500);
    }
  },
};
