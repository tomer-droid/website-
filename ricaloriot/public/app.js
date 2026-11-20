// Entry point: access gate, wiring, and the bits that keep the screen fresh.
import { app, actions, forms, on, $, setHooks, render, startSync, tryCode, todayKey, saveFlags } from './core.js';
import { renderView } from './views.js';
import { openFirstRun, closeSheet } from './sheets.js';

const gate = $('#gate');
const shell = $('#app');

function syncBadge() {
  const el = $('#sync');
  el.dataset.s = app.sync;
  const txt = el.lastElementChild;
  if (app.sync === 'off') txt.textContent = 'אין חיבור';
  else if (app.syncedAt) {
    const d = new Date(app.syncedAt);
    txt.textContent = `מעודכן ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

function showGate(msg = '') {
  closeSheet();
  shell.hidden = true;
  gate.hidden = false;
  $('#gate-err').textContent = msg;
  $('#gate-code').value = '';
}

let started = false;
function enter() {
  gate.hidden = true;
  shell.hidden = false;
  render();
  // keep the code in the address + manifest, so "add to home screen" opens already unlocked
  const k = encodeURIComponent(app.code);
  $('link[rel="manifest"]').href = `/api/manifest?k=${k}`;
  history.replaceState(null, '', `/?k=${k}`);
  if (started) return;
  started = true;
  startSync().then(() => {
    // ask for the daily goal only when the cloud itself says there is none yet
    if (app.sync === 'ok' && app.server && !app.state.profile?.kcalGoal && !$('#sheet-root').classList.contains('open')) openFirstRun();
  });
}

setHooks({
  render: renderView,
  syncBadge,
  locked: () => showGate('צריך להזין שוב את קוד הכניסה.'),
});

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  const fn = el && actions[el.dataset.act];
  if (fn) fn(el, ev);
});

document.addEventListener('submit', (ev) => {
  const form = ev.target.closest('form[data-form]');
  if (!form) return;
  ev.preventDefault();
  forms[form.dataset.form]?.(form, ev);
});

forms.gate = async (form) => {
  const code = $('#gate-code').value.trim();
  if (!code) return;
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  const r = await tryCode(code);
  btn.disabled = false;
  if (r === 'ok') return enter();
  $('#gate-err').textContent =
    r === 'wrong'
      ? 'הקוד לא נכון. מנסים שוב?'
      : r === 'blocked'
        ? 'יותר מדי ניסיונות. אפשר לנסות שוב בעוד כמה דקות.'
        : 'אין חיבור לאינטרנט כרגע.';
  form.classList.remove('shake');
  void form.offsetWidth;
  form.classList.add('shake');
};

// Android: offer the real install prompt
window.addEventListener('beforeinstallprompt', (ev) => {
  ev.preventDefault();
  window.rkInstall = ev;
  if (!shell.hidden) render();
});
on({
  async install() {
    const ev = window.rkInstall;
    if (!ev) return;
    ev.prompt();
    await ev.userChoice.catch(() => {});
    window.rkInstall = null;
    saveFlags({ installDismissed: true });
    render();
  },
});

// a new day starts on its own
let day = todayKey();
setInterval(() => {
  if (todayKey() !== day) {
    day = todayKey();
    if (!shell.hidden) render();
  }
}, 30e3);

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

(async function boot() {
  const urlCode = new URLSearchParams(location.search).get('k');
  if (urlCode && urlCode !== app.code) {
    const r = await tryCode(urlCode);
    if (r === 'ok') return enter();
    if (!app.code) return showGate(r === 'wrong' ? 'הקישור הזה כבר לא תקף. אפשר להזין את הקוד.' : r === 'offline' ? 'אין חיבור לאינטרנט כרגע.' : '');
  }
  if (app.code) enter();
  else showGate();
})();
