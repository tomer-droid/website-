// The three screens: today / suggestions by calories / the food list.
import { app, on, $, esc, fmt, fmt1, budget, render, saveCart, todayKey, weighIns } from './core.js';
import { CATS, getFoods, getMeals, mealCalc, isMissing, perOne, qtyText } from './foods.js';

const TOL = 25; // a meal may pass the remaining calories by this much and still count as fitting
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- calorie levels: 300 means "about 300" (251-350)
export const LEVELS = [200, 300, 400, 500, 600, 700, 800];
const levelOf = (kcal) => (kcal <= 250 ? 200 : Math.min(800, Math.round(kcal / 100) * 100));
const levelName = (l) => (l === 200 ? 'עד 250' : l === 800 ? '800+' : String(l));
const levelTop = (l) => (l === 200 ? 250 : l === 800 ? 800 : l + 50);

/** The biggest level that surely fits in what is left today. */
export function fitLevel(b = budget()) {
  if (!b.hasGoal) return 400;
  let best = 200;
  for (const l of LEVELS) if (levelTop(l) <= b.left + TOL) best = l;
  return best;
}

export function ideas() {
  const foods = getFoods(app.state);
  const out = [];
  for (const m of getMeals(app.state)) {
    const c = mealCalc(m.items, foods);
    if (!c) continue;
    const ready = c.missing.length === 0;
    out.push({ m, ...c, ready, level: ready ? levelOf(c.kcal) : null });
  }
  return out;
}

export const missingFoods = () => [...getFoods(app.state).values()].filter(isMissing);

/** "חלבון 12 ג׳ · שומן 5 ג׳" as two small labels */
const macros = (protein, fat) =>
  `<span class="tag p">חלבון ${fmt(protein)} ג׳</span><span class="tag f">שומן ${fat === null ? '—' : fmt(fat) + ' ג׳'}</span>`;

function ideaCard(x, b) {
  const over = x.ready && b.hasGoal && x.kcal > b.left + TOL;
  const tags = x.ready
    ? macros(x.protein, x.fat) + (over ? '<span class="tag over">יותר ממה שנשאר היום</span>' : '')
    : `<span class="tag w">חסר נתון: ${esc(x.missing.map((f) => f.name).join(', '))}</span>`;
  return `<button type="button" class="idea${x.ready ? '' : ' wait'}" data-act="idea" data-id="${esc(x.m.id)}">
    <div class="idea-main">
      <h3>${esc(x.m.name)}</h3>
      <p class="ing">${esc(x.rows.map((r) => qtyText(r.f, r.q)).join(' · '))}</p>
      <div class="tags">${tags}</div>
    </div>
    <div class="idea-nums"><b>${x.ready ? fmt(x.kcal) : '?'}</b><small>קל׳</small></div>
  </button>`;
}

function fillBanner(n) {
  if (!n) return '';
  return `<button type="button" class="banner" data-act="fill-next">
    <span class="banner-n">${n}</span>
    <span class="banner-t"><b>${n === 1 ? 'מוצר אחד מחכה' : 'מוצרים מחכים'} לנתונים מהאריזה</b>
    <small>ממלאים פעם אחת, וזה נשמר לשניכם</small></span>
    <span class="banner-go">למלא</span>
  </button>`;
}

// ---------- today
const hhmm = (ms) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

function logHTML(b) {
  if (!b.entries.length) return '<p class="muted pad">עוד לא נרשם כלום היום.</p>';
  const rows = [...b.entries]
    .sort((a, z) => z.at - a.at)
    .map(
      (e) => `<li>
        <span class="log-t">${hhmm(e.at)}</span>
        <span class="log-n">${esc(e.note || 'אכילה')}</span>
        <span class="log-k"><b>${fmt(e.kcal)}</b> קל׳${e.protein ? ` · ${fmt1(e.protein)} ג׳` : ''}</span>
        <button type="button" class="log-x" data-act="del-entry" data-id="${esc(e.id)}" aria-label="מחיקה">✕</button>
      </li>`,
    )
    .join('');
  return `<ul class="log">${rows}</ul>`;
}

function installCard() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone) return ''; // already installed
  return `<section class="install">
    <button type="button" class="install-go" data-act="install-help"><b>להתקין כאפליקציה בטלפון</b><span>לוחצים כאן להסבר קצר ←</span></button>
  </section>`;
}

// ---------- weight
export const kgText = (kg) => (Math.round(kg * 100) / 100).toLocaleString('en-US');

/** "ירידה של 0.3 ק״ג" / "עלייה של 0.2 ק״ג" / "בלי שינוי" */
export function changeText(diff) {
  const d = Math.round(diff * 10) / 10;
  if (!d) return 'בלי שינוי';
  return `${d < 0 ? 'ירידה' : 'עלייה'} של ${Math.abs(d).toLocaleString('en-US')} ק״ג`;
}

export function dayText(day) {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();
  const diff = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - date) / 864e5);
  if (diff === 0) return 'היום';
  if (diff === 1) return 'אתמול';
  return `${date.toLocaleDateString('he-IL', { weekday: 'short' })} ${d}.${m}`;
}

const dayNum = (day) => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 864e5;
};

/**
 * Smooths out the daily ups and downs. For every weigh-in:
 *  avg  - moving average (each day pulls the average 10% of the way toward the new reading)
 *  rate - how much that average moved over the last 7 days (null until there are two readings)
 */
export function weightTrend(list) {
  const out = [];
  for (const w of list) {
    const n = dayNum(w.day);
    const prev = out[out.length - 1];
    const avg = prev ? prev.avg + (1 - 0.9 ** Math.max(1, n - prev.n)) * (w.kg - prev.avg) : w.kg;
    let rate = null;
    if (prev) {
      const target = n - 7;
      const first = out[0];
      if (first.n >= target) rate = ((avg - first.avg) / (n - first.n)) * 7;
      else {
        let i = out.length - 1;
        while (out[i].n > target) i--;
        const a = out[i];
        const b = out[i + 1] || { n, avg };
        const at = a.avg + ((b.avg - a.avg) * (target - a.n)) / (b.n - a.n);
        rate = avg - at;
      }
    }
    out.push({ ...w, n, avg, rate });
  }
  return out;
}

/** "↓ 0.1" in a coloured pill; down is green */
export function ratePill(rate) {
  if (rate === null) return '<span class="rate">—</span>';
  const r = Math.round(rate * 10) / 10;
  if (!r) return '<span class="rate">0</span>';
  return `<span class="rate ${r < 0 ? 'down' : 'up'}">${r < 0 ? '↓' : '↑'} ${Math.abs(r).toLocaleString('en-US')}</span>`;
}

function weightCard() {
  const list = weighIns();
  const last = list[list.length - 1];
  const prev = list[list.length - 2];
  const done = !!last && last.day === todayKey();
  let sub;
  if (!last) sub = 'עוד לא נרשם משקל';
  else if (!done) sub = `עוד לא נרשם היום · אחרון: ${dayText(last.day)}`;
  else {
    const t = weightTrend(list).pop();
    sub = prev ? `נרשם היום · ממוצע ${(Math.round(t.avg * 10) / 10).toLocaleString('en-US')} · קצב שבועי ${ratePill(t.rate)}` : 'נרשם היום';
  }
  return `<button type="button" class="weight${done ? ' done' : ''}" data-act="weight">
    <span class="w-ico">⚖️</span>
    <span class="w-txt"><b>${last ? `${kgText(last.kg)} ק״ג` : 'משקל'}</b><small>${sub}</small></span>
    <span class="w-go">${done ? 'עדכון' : 'רישום משקל'}</span>
  </button>`;
}

function todayHTML() {
  const b = budget();
  if (!b.hasGoal) {
    return `<section class="empty-card">
      <h2>עוד לא הוגדר יעד יומי</h2>
      <p>מגדירים פעם אחת כמה קלוריות וכמה חלבון ביום — ומכאן הכול מחושב לבד.</p>
      <button type="button" class="btn primary" data-act="settings">הגדרת יעד</button>
    </section>${weightCard()}${installCard()}`;
  }
  const over = b.left < 0;
  const kPct = Math.min(100, Math.max(0, (b.kcal / b.kcalGoal) * 100));
  const pPct = b.proteinGoal ? Math.min(100, Math.max(0, (b.protein / b.proteinGoal) * 100)) : 0;
  const pDone = b.proteinGoal && b.pLeft <= 0;

  return `<section class="hero${over ? ' over' : ''}">
    <div class="hero-label">${b.name ? `נשאר ל${esc(b.name)} היום` : 'נשאר להיום'}</div>
    <div class="hero-nums">
      <div class="stat kcal">
        <div class="big" data-k="kcal" data-n="${Math.abs(b.left)}">${fmt(Math.abs(b.left))}</div>
        <div class="unit">${over ? 'קלוריות מעל היעד' : 'קלוריות'}</div>
        <div class="bar"><i data-k="kbar" data-w="${kPct.toFixed(1)}" style="width:${kPct.toFixed(1)}%"></i></div>
        <div class="cap">נאכלו ${fmt(b.kcal)} מתוך ${fmt(b.kcalGoal)}</div>
      </div>
      <div class="stat protein">
        ${
          b.proteinGoal
            ? `<div class="big" data-k="prot" data-n="${Math.max(0, Math.round(b.pLeft))}">${fmt(Math.max(0, b.pLeft))}</div>
        <div class="unit">${pDone ? 'גרם חלבון · הושג ✓' : 'גרם חלבון'}</div>
        <div class="bar"><i data-k="pbar" data-w="${pPct.toFixed(1)}" style="width:${pPct.toFixed(1)}%"></i></div>
        <div class="cap">${fmt(b.protein)} מתוך ${fmt(b.proteinGoal)}</div>`
            : `<div class="big">—</div><div class="unit">חלבון</div><div class="cap">לא הוגדר יעד</div>`
        }
      </div>
    </div>
  </section>
  <button type="button" class="goal-line" data-act="settings">
    <span>היעד היומי: ${fmt(b.kcalGoal)} קל׳${b.proteinGoal ? ` · ${fmt(b.proteinGoal)} ג׳ חלבון` : ''}</span><b>שינוי היעד</b>
  </button>

  <div class="actions">
    <button type="button" class="btn primary" data-act="add-entry"><span class="plus">+</span> אכלתי משהו</button>
    <button type="button" class="btn" data-act="go-ideas">מה להכין?</button>
  </div>
  ${weightCard()}

  <section class="block">
    <header><h2>מה נאכל היום</h2></header>
    ${logHTML(b)}
  </section>
  ${installCard()}`;
}

// numbers count up/down and bars slide when the data changes (also when the other phone changed it)
const prev = {};
function animate(root) {
  root.querySelectorAll('[data-k]').forEach((el) => {
    const key = el.dataset.k;
    const isBar = 'w' in el.dataset;
    const to = Number(isBar ? el.dataset.w : el.dataset.n);
    const from = prev[key];
    prev[key] = to;
    if (from === undefined || from === to || calm) return;
    if (isBar) {
      el.style.width = from + '%';
      requestAnimationFrame(() => requestAnimationFrame(() => (el.style.width = to + '%')));
      return;
    }
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / 500);
      el.textContent = fmt(from + (to - from) * (1 - (1 - p) ** 3));
      if (p < 1 && el.isConnected) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// ---------- suggestions by calories
function ideasHTML() {
  const b = budget();
  const all = ideas();
  const fit = fitLevel(b);
  const level = app.level || fit;
  const here = all.filter((x) => x.level === level).sort((a, z) => a.kcal - z.kcal);
  const wait = all.filter((x) => !x.ready);
  const sub = !b.hasGoal
    ? 'בוחרים כמה קלוריות — ורואים מה אפשר להכין'
    : b.left > 0
      ? `נשארו ${fmt(b.left)} קלוריות להיום`
      : 'היעד להיום הושלם';
  const chips = LEVELS.map((l) => {
    const cls = `lvl${l === level ? ' on' : ''}${b.hasGoal && l > fit ? ' far' : ''}`;
    return `<button type="button" class="${cls}" data-act="level" data-l="${l}"><b>${levelName(l)}</b><small>קל׳</small></button>`;
  }).join('');
  return `<p class="lead">${sub}</p>
    <div class="levels" id="levels">${chips}</div>
    ${
      here.length
        ? here.map((x) => ideaCard(x, b)).join('')
        : '<p class="muted pad">אין עדיין הצעה בגודל הזה. אפשר להרכיב אחת ב״רשימה״ ולשמור אותה.</p>'
    }
    ${
      wait.length
        ? `<h2 class="sep">עוד הצעות — ייפתחו כשיושלמו הנתונים</h2>${fillBanner(missingFoods().length)}${wait.map((x) => ideaCard(x, b)).join('')}`
        : ''
    }`;
}

// ---------- the list (how much is in everything + putting a meal together)
function foodRow(f) {
  const q = app.cart[f.id] || 0;
  const p = perOne(f);
  const line = (k, pr, fa) => `<b>${fmt(k)} קל׳</b> · חלבון ${fmt1(pr)} · שומן ${fa === null ? '—' : fmt1(fa)}`;
  let sub;
  if (!p) sub = '<small class="need">חסרים נתונים מהאריזה</small>';
  else if (q > 0) {
    const label = f.qty === 'gram' ? `${fmt(q)} ג׳` : `× ${fmt1(q)}`;
    sub = `<small class="sum">${label} = ${line(p.kcal * q, p.protein * q, p.fat === null ? null : p.fat * q)}</small>`;
  } else if (f.qty === 'gram') sub = `<small>${line(f.kcal, f.protein || 0, f.fat ?? null)} <i>ל-100 ג׳</i></small>`;
  else sub = `<small>${line(p.kcal, p.protein, p.fat)} <i>ל${esc(f.unit)}</i></small>`;
  const note = f.note && !(q > 0) ? `<small class="note">${esc(f.note)}</small>` : '';
  const id = esc(f.id);
  const side = !p
    ? `<button type="button" class="fill" data-act="food-edit" data-id="${id}">למלא</button>`
    : `<div class="stepper${q > 0 ? ' on' : ''}">
        <button type="button" data-act="qty" data-id="${id}" data-d="-1" aria-label="פחות">−</button>
        <output>${f.qty === 'gram' ? fmt(q) + ' ג׳' : fmt1(q)}</output>
        <button type="button" data-act="qty" data-id="${id}" data-d="1" aria-label="עוד">+</button>
      </div>`;
  return `<li class="food${q > 0 ? ' on' : ''}${p ? '' : ' missing'}">
    <button type="button" class="food-info" data-act="food-edit" data-id="${id}">
      <span class="emo">${f.emoji || '🍽️'}</span>
      <span class="txt"><b>${esc(f.name)}</b>${sub}${note}</span>
    </button>${side}
  </li>`;
}

function foodsListHTML() {
  const term = app.search.trim();
  const foods = [...getFoods(app.state).values()].filter((f) => !term || f.name.includes(term));
  if (!foods.length) return '<p class="muted pad">לא נמצא מאכל כזה. אפשר להוסיף אותו למטה.</p>';
  let html = '';
  for (const [cat, title] of CATS) {
    const rows = foods.filter((f) => (CATS.some(([c]) => c === f.cat) ? f.cat : 'other') === cat);
    if (rows.length) html += `<h2 class="cat">${title}</h2><ul class="foods">${rows.map(foodRow).join('')}</ul>`;
  }
  return html;
}

const foodsShell = () => `<p class="lead">כמה יש בכל דבר. לוחצים + כדי להרכיב ארוחה.</p>
  <input id="food-search" class="search" type="search" placeholder="חיפוש מאכל" autocomplete="off" enterkeyhint="search" value="${esc(app.search)}">
  <div id="foods-banner"></div>
  <div id="foods-list"></div>
  <button type="button" class="btn wide" data-act="food-new"><span class="plus">+</span> מאכל חדש</button>`;

export function cartCalc() {
  const foods = getFoods(app.state);
  const items = Object.entries(app.cart).filter(([id, q]) => q > 0 && foods.has(id));
  return { items, ...mealCalc(items, foods) };
}

function cartHTML() {
  const c = cartCalc();
  if (app.tab !== 'foods' || !c.items.length) return '';
  const b = budget();
  const after = b.left - c.kcal;
  const sub = !b.hasGoal ? '' : after >= 0 ? `יישארו ${fmt(after)} קל׳ להיום` : `חורג ב-${fmt(-after)} קל׳`;
  return `<div class="cart${b.hasGoal && after < 0 ? ' over' : ''}">
    <button type="button" class="cart-x" data-act="cart-clear" aria-label="ניקוי">✕</button>
    <button type="button" class="cart-txt" data-act="cart-open">
      <b>${fmt(c.kcal)} קל׳ · חלבון ${fmt(c.protein)} · שומן ${c.fat === null ? '—' : fmt(c.fat)}</b>
      ${sub && `<small>${sub}</small>`}
    </button>
    <button type="button" class="btn primary sm" data-act="cart-open">סיכום</button>
  </div>`;
}

// ---------- mount / update
export function renderView() {
  const view = $('#view');
  const tab = app.tab;
  const fresh = view.dataset.tab !== tab;
  if (fresh) {
    view.dataset.tab = tab;
    view.innerHTML = tab === 'foods' ? foodsShell() : '';
    window.scrollTo(0, 0);
  }
  if (tab === 'today') {
    view.innerHTML = todayHTML();
    animate(view);
  } else if (tab === 'ideas') {
    const left = $('#levels')?.scrollLeft;
    view.innerHTML = ideasHTML();
    const row = $('#levels');
    if (left !== undefined && !fresh) row.scrollLeft = left;
    else row.querySelector('.on')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  } else {
    $('#foods-banner').innerHTML = app.search ? '' : fillBanner(missingFoods().length);
    $('#foods-list').innerHTML = foodsListHTML();
  }
  const cart = cartHTML();
  $('#cart').innerHTML = cart;
  document.body.classList.toggle('has-cart', !!cart);
  document.querySelectorAll('.tabs button').forEach((btn) => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle('on', active);
    if (active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
}

on({
  tab(el) {
    app.tab = el.dataset.tab;
    render();
  },
  'go-ideas'() {
    app.level = null; // start from the level that fits what is left
    app.tab = 'ideas';
    render();
  },
  level(el) {
    app.level = Number(el.dataset.l);
    render();
  },
  qty(el) {
    const f = getFoods(app.state).get(el.dataset.id);
    if (!f) return;
    const step = f.qty === 'gram' ? f.step || 50 : 1;
    const q = Math.max(0, (app.cart[f.id] || 0) + step * Number(el.dataset.d));
    app.cart[f.id] = Math.round(q * 100) / 100;
    saveCart();
    render();
  },
});

document.addEventListener('input', (ev) => {
  if (ev.target.id !== 'food-search') return;
  app.search = ev.target.value;
  render();
});
