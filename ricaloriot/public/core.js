// App state, local persistence and live sync with the shared cloud copy.
import { applyOps, emptyState } from './ops.js';

const K = { code: 'rk.code', state: 'rk.state', queue: 'rk.queue', cart: 'rk.cart', flags: 'rk.flags' };

export const ls = {
  get(k, d) {
    try {
      const v = localStorage.getItem(k);
      return v === null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
  del(k) {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
};

export const app = {
  code: ls.get(K.code, ''),
  server: ls.get(K.state, null), // last state received from the cloud
  pending: ls.get(K.queue, []), // changes made here that the cloud has not confirmed yet
  state: emptyState(), // server + pending = what the screen shows
  tab: 'today',
  filter: 'fit',
  search: '',
  cart: ls.get(K.cart, {}), // food id -> quantity, the meal being put together on this phone
  flags: ls.get(K.flags, {}),
  sync: 'idle', // idle | busy | ok | off
  syncedAt: 0,
};

// ---------- small helpers
export const $ = (sel, root = document) => root.querySelector(sel);
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const fmt = (n) => Math.round(n).toLocaleString('en-US');
export const fmt1 = (n) => (Math.round(n * 10) / 10).toLocaleString('en-US');
export const round1 = (n) => Math.round(n * 10) / 10;
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const parseNum = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.').trim());
  return Number.isFinite(n) ? n : null;
};

export function todayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function totals(state = app.state, day = todayKey()) {
  const entries = state.days?.[day]?.entries || [];
  let kcal = 0;
  let protein = 0;
  for (const e of entries) {
    kcal += e.kcal;
    protein += e.protein || 0;
  }
  return { kcal, protein: round1(protein), entries };
}

/** Everything the screens need about today's budget. */
export function budget() {
  const p = app.state.profile || {};
  const t = totals();
  const kcalGoal = p.kcalGoal || 0;
  const proteinGoal = p.proteinGoal || 0;
  return {
    ...t,
    name: p.name || '',
    kcalGoal,
    proteinGoal,
    hasGoal: kcalGoal > 0,
    left: kcalGoal - t.kcal,
    pLeft: round1(proteinGoal - t.protein),
  };
}

export function saveFlags(patch) {
  Object.assign(app.flags, patch);
  ls.set(K.flags, app.flags);
}

export function saveCart() {
  for (const id of Object.keys(app.cart)) if (!(app.cart[id] > 0)) delete app.cart[id];
  ls.set(K.cart, app.cart);
}

// ---------- wiring (filled in by app.js / views.js / sheets.js)
export const actions = {};
export const forms = {};
export const on = (map) => Object.assign(actions, map);
export const onForm = (map) => Object.assign(forms, map);

const hooks = { render() {}, syncBadge() {}, locked() {} };
export const setHooks = (h) => Object.assign(hooks, h);
export const render = () => hooks.render();

// ---------- toast
let toastTimer = 0;
export function toast(msg, { action, onAction, ms = 3200 } = {}) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action)}</button>` : ''}`;
  const btn = el.querySelector('button');
  if (btn)
    btn.onclick = () => {
      el.classList.remove('show');
      onAction?.();
    };
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), action ? 5500 : ms);
}

// ---------- state
const clone = (o) => JSON.parse(JSON.stringify(o));

function recompute() {
  app.state = applyOps(clone(app.server || emptyState()), app.pending);
}
recompute();

/** Make a change: shows immediately on this phone, then goes to the cloud. */
let pushTimer = 0;
export function dispatch(...ops) {
  app.pending.push(...ops);
  ls.set(K.queue, app.pending);
  recompute();
  render();
  clearTimeout(pushTimer);
  pushTimer = setTimeout(sync, 250);
}

// ---------- cloud
async function call(method, body, code = app.code) {
  const rev = method === 'GET' && app.server ? `?rev=${app.server.rev}` : '';
  const res = await fetch('/api/state' + rev, {
    method,
    cache: 'no-store',
    headers: { 'x-rk-code': code, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const err = new Error('http ' + res.status);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function setSync(s) {
  app.sync = s;
  hooks.syncBadge();
}

let inflight = null;
let pollTimer = 0;
let lastActive = Date.now();

export function sync() {
  if (!app.code) return Promise.resolve();
  if (inflight) return inflight;
  inflight = (async () => {
    setSync('busy');
    let changed = false;
    try {
      for (;;) {
        const batch = app.pending.slice();
        let next = null;
        try {
          next = batch.length ? await call('POST', { ops: batch }) : await call('GET');
        } catch (e) {
          // a batch the server refuses to read must not block the queue forever
          if (batch.length && (e.status === 400 || e.status === 413)) next = null;
          else throw e;
        }
        if (next) {
          changed = changed || !app.server || next.rev !== app.server.rev;
          app.server = next;
          ls.set(K.state, next);
        }
        if (batch.length) {
          app.pending = app.pending.slice(batch.length);
          ls.set(K.queue, app.pending);
        }
        if (!app.pending.length) break;
      }
      recompute();
      app.syncedAt = Date.now();
      setSync('ok');
      if (changed) render();
    } catch (e) {
      if (e.status === 401) {
        lock();
        return;
      }
      setSync('off');
    } finally {
      inflight = null;
      schedulePoll();
    }
  })();
  return inflight;
}

// Poll gently: fast while someone is using the app, slower when it just sits open.
function pollDelay() {
  const idle = Date.now() - lastActive;
  if (app.sync === 'off') return 8000;
  return idle < 120e3 ? 10e3 : idle < 600e3 ? 30e3 : 60e3;
}

function schedulePoll() {
  clearTimeout(pollTimer);
  if (document.hidden || !app.code) return;
  pollTimer = setTimeout(sync, pollDelay());
}

export function startSync() {
  const wake = () => {
    if (document.hidden) return clearTimeout(pollTimer);
    lastActive = Date.now();
    sync();
  };
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('pageshow', wake);
  window.addEventListener('focus', wake);
  window.addEventListener('online', wake);
  window.addEventListener(
    'pointerdown',
    () => {
      const wasIdle = Date.now() - lastActive > 30e3;
      lastActive = Date.now();
      if (wasIdle) sync();
    },
    { passive: true },
  );
  return sync();
}

// ---------- access code
/** Check a code against the cloud. Returns 'ok' | 'wrong' | 'blocked' | 'offline'. */
export async function tryCode(code) {
  try {
    const prev = app.server;
    app.server = null; // ask for the full state
    let next;
    try {
      next = await call('GET', null, code);
    } finally {
      app.server = prev;
    }
    app.code = code;
    ls.set(K.code, code);
    app.server = next;
    ls.set(K.state, next);
    recompute();
    app.syncedAt = Date.now();
    setSync('ok');
    return 'ok';
  } catch (e) {
    return e.status === 401 ? 'wrong' : e.status === 429 ? 'blocked' : 'offline';
  }
}

export function lock() {
  app.code = '';
  app.server = null;
  app.pending = [];
  ls.del(K.code);
  ls.del(K.state);
  ls.del(K.queue);
  recompute();
  clearTimeout(pollTimer);
  hooks.locked();
}
