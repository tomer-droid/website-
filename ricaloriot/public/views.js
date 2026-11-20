// The three screens: today / ideas / foods.
import { app, on, $, esc, fmt, fmt1, budget, render, saveCart } from './core.js';
import { CATS, getFoods, getMeals, mealCalc, isMissing, perOne, qtyText } from './foods.js';

const TOL = 25; // an idea may pass the remaining calories by this much and still count as fitting
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- ideas: what fits the remaining budget
export function ideas() {
  const foods = getFoods(app.state);
  const b = budget();
  const out = [];
  for (const m of getMeals(app.state)) {
    const c = mealCalc(m.items, foods);
    if (!c) continue;
    const ready = c.missing.length === 0;
    const fits = ready && (!b.hasGoal || c.kcal <= b.left + TOL);
    const dens = ready && c.kcal > 0 ? (c.protein / c.kcal) * 100 : 0; // g protein per 100 kcal
    let score = 0;
    if (fits && b.hasGoal && b.left > 0) {
      const fill = Math.min(1, c.kcal / b.left);
      const prot = b.pLeft > 0 ? Math.min(1, c.protein / b.pLeft) : 0.5;
      score = fill * 0.45 + prot * 0.55 - (m.tag === 'sweet' ? 0.35 : 0);
    }
    out.push({ m, ...c, ready, fits, dens, score });
  }
  return out;
}

export const missingFoods = () => [...getFoods(app.state).values()].filter(isMissing);

function ideaCard(x, b) {
  const tags = [];
  if (!x.ready) {
    tags.push(`<span class="tag w">חסר נתון: ${esc(x.missing.map((f) => f.name).join(', '))}</span>`);
  } else {
    if (b.hasGoal) {
      if (!x.fits) tags.push(`<span class="tag over">חורג ב-${fmt(x.kcal - b.left)} קל׳</span>`);
      else if (b.left - x.kcal >= TOL) tags.push(`<span class="tag">יישארו ${fmt(b.left - x.kcal)} קל׳</span>`);
      else tags.push('<span class="tag">סוגר את היום</span>');
    }
    if (b.pLeft > 0 && x.protein >= b.pLeft) tags.push('<span class="tag p">סוגר את החלבון</span>');
    else if (x.dens >= 7) tags.push('<span class="tag p">עשיר בחלבון</span>');
  }
  if (x.m.custom) tags.push('<span class="tag">שלנו</span>');
  const nums = x.ready
    ? `<b>${fmt(x.kcal)}</b><small>קל׳</small><span>${fmt(x.protein)} ג׳ חלבון</span>`
    : '<b>?</b><small>קל׳</small>';
  return `<button type="button" class="idea${x.ready ? '' : ' wait'}" data-act="idea" data-id="${esc(x.m.id)}">
    <div class="idea-main">
      <h3>${esc(x.m.name)}</h3>
      <p class="ing">${esc(x.rows.map((r) => qtyText(r.f, r.q)).join(' · '))}</p>
      <div class="tags">${tags.join('')}</div>
    </div>
    <div class="idea-nums">${nums}</div>
  </button>`;
}

function fillBanner(n) {
  if (!n) return '';
  return `<button type="button" class="banner" data-act="fill-next">
    <span class="banner-n">${n}</span>
    <span class="banner-t"><b>${n === 1 ? 'מוצר אחד מחכה' : 'מוצרים מחכים'} לנתונים מהאריזה</b>
    <small>ממלאים פעם אחת — נשמר לשניכם ופותח עוד רעיונות</small></span>
    <span class="banner-go">השלמה</span>
  </button>`;
}

// ---------- today
function hint(b) {
  const parts = [];
  if (b.left <= 0) {
    parts.push('היעד היומי הושלם. אם רעבים — ירקות, או משהו ממש קטן.');
    if (b.proteinGoal && b.pLeft > 0) parts.push(`חסרים עוד ${fmt(b.pLeft)} גרם חלבון.`);
    return parts.join(' ');
  }
  if (b.left < 150) parts.push('נשאר ממש מעט — מספיק לנשנוש קטן.');
  else if (b.left < 350) parts.push('מספיק לארוחה קלה או לנשנוש.');
  else if (b.left < 600) parts.push('מספיק לארוחת ערב רגילה.');
  else if (b.left < 900) parts.push('מספיק לארוחה גדולה, או לארוחה רגילה וקינוח.');
  else parts.push('יש הרבה מקום: ארוחה גדולה וגם קינוח.');
  if (b.proteinGoal) {
    if (b.pLeft <= 0) parts.push('החלבון להיום כבר סגור.');
    else if ((b.pLeft / b.left) * 100 >= 8) parts.push('חשוב שתהיה עשירה בחלבון — ביצים, קוטג׳, עוף.');
    else if (b.pLeft <= 60) parts.push(`כדאי שיהיו בה בערך ${fmt(b.pLeft)} גרם חלבון.`);
    else parts.push(`נשארו עוד ${fmt(b.pLeft)} גרם חלבון להיום.`);
  }
  return parts.join(' ');
}

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
  if (standalone || app.flags.installDismissed) return '';
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const how = ios
    ? 'בספארי: כפתור השיתוף <span class="kbd">⬆︎</span> ← ״הוספה למסך הבית״.'
    : 'בתפריט הדפדפן <span class="kbd">⋮</span> ← ״התקנת האפליקציה״ או ״הוספה למסך הבית״.';
  const btn = window.rkInstall ? '<button type="button" class="btn primary sm" data-act="install">התקנה</button>' : '';
  return `<section class="install">
    <div><b>רוצים את זה כאפליקציה בטלפון?</b><p>${how}</p>${btn}</div>
    <button type="button" class="log-x" data-act="install-dismiss" aria-label="סגירה">✕</button>
  </section>`;
}

function todayHTML() {
  const b = budget();
  const missing = missingFoods().length;
  if (!b.hasGoal) {
    return `<section class="empty-card">
      <h2>עוד לא הוגדר יעד יומי</h2>
      <p>מגדירים פעם אחת כמה קלוריות וכמה חלבון ביום — ומכאן הכול מחושב לבד.</p>
      <button type="button" class="btn primary" data-act="settings">הגדרת יעד</button>
    </section>${installCard()}`;
  }
  const over = b.left < 0;
  const kPct = Math.min(100, Math.max(0, (b.kcal / b.kcalGoal) * 100));
  const pPct = b.proteinGoal ? Math.min(100, Math.max(0, (b.protein / b.proteinGoal) * 100)) : 0;
  const pDone = b.proteinGoal && b.pLeft <= 0;
  const top = ideas()
    .filter((x) => x.fits && x.ready)
    .sort((a, z) => z.score - a.score)
    .slice(0, 3);

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
    <p class="hint">${esc(hint(b))}</p>
  </section>

  <div class="actions">
    <button type="button" class="btn primary" data-act="add-entry"><span class="plus">+</span> אכלתי משהו</button>
    <button type="button" class="btn" data-act="tab" data-tab="foods">הרכבת ארוחה</button>
  </div>

  <section class="block">
    <header><h2>מה אפשר להכין עכשיו</h2><button type="button" class="link" data-act="tab" data-tab="ideas">כל הרעיונות</button></header>
    ${
      top.length
        ? top.map((x) => ideaCard(x, b)).join('')
        : `<p class="muted pad">${over || b.left < 60 ? 'אין כרגע רעיון שנכנס במה שנשאר.' : 'עוד אין רעיונות עם נתונים מלאים שנכנסים במה שנשאר.'}</p>`
    }
    ${fillBanner(missing)}
  </section>

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

// ---------- ideas screen
const FILTERS = [
  ['fit', 'מתאים עכשיו'],
  ['all', 'הכול'],
  ['prot', 'עשיר בחלבון'],
  ['sweet', 'מתוק'],
];

function ideasHTML() {
  const b = budget();
  const all = ideas();
  const f = app.filter;
  const pick = (x) =>
    f === 'fit' ? x.fits : f === 'prot' ? x.dens >= 7 : f === 'sweet' ? x.m.tag === 'sweet' : true;
  const ready = all
    .filter((x) => x.ready && pick(x))
    .sort((a, z) => (f === 'fit' ? z.score - a.score : Number(z.fits) - Number(a.fits) || z.kcal - a.kcal));
  const wait = all.filter((x) => !x.ready && (f === 'sweet' ? x.m.tag === 'sweet' : f !== 'prot'));
  const sub = !b.hasGoal
    ? 'עוד לא הוגדר יעד יומי'
    : b.left > 0
      ? `נשארו ${fmt(b.left)} קל׳${b.proteinGoal && b.pLeft > 0 ? ` ו-${fmt(b.pLeft)} ג׳ חלבון` : ''}`
      : 'היעד היומי הושלם';
  return `<div class="page-head"><h1>רעיונות</h1><p>${sub}</p></div>
    <div class="chips scroll">${FILTERS.map(
      ([id, name]) =>
        `<button type="button" class="chip${f === id ? ' on' : ''}" data-act="filter" data-f="${id}">${name}</button>`,
    ).join('')}</div>
    ${
      ready.length
        ? ready.map((x) => ideaCard(x, b)).join('')
        : `<p class="muted pad">${f === 'fit' ? 'אין כרגע רעיון עם נתונים מלאים שנכנס במה שנשאר.' : 'אין כאן רעיונות עם נתונים מלאים.'}</p>`
    }
    ${
      wait.length
        ? `<h2 class="sep">ייפתחו כשיושלמו הנתונים</h2>${fillBanner(missingFoods().length)}${wait.map((x) => ideaCard(x, b)).join('')}`
        : ''
    }`;
}

// ---------- foods screen (reference list + meal builder)
function foodRow(f) {
  const q = app.cart[f.id] || 0;
  const p = perOne(f);
  let sub;
  if (!p) sub = '<small class="need">חסרים נתונים מהאריזה</small>';
  else if (q > 0) {
    const label = f.qty === 'gram' ? `${fmt(q)} ג׳` : `× ${fmt1(q)}`;
    sub = `<small class="sum">${label} = ${fmt(p.kcal * q)} קל׳ · ${fmt1(p.protein * q)} ג׳ חלבון</small>`;
  } else if (f.qty === 'gram') sub = `<small>${fmt1(f.kcal)} קל׳ · ${fmt1(f.protein || 0)} ג׳ חלבון · ל-100 ג׳</small>`;
  else sub = `<small>${fmt(p.kcal)} קל׳ · ${fmt1(p.protein)} ג׳ חלבון · ל${esc(f.unit)}</small>`;
  const note = f.note && !(q > 0) ? `<small class="note">${esc(f.note)}</small>` : '';
  const id = esc(f.id);
  const side = !p
    ? `<button type="button" class="fill" data-act="food-edit" data-id="${id}">השלמה</button>`
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

const foodsShell = () => `<div class="page-head"><h1>מאכלים</h1><p>לוחצים + כדי להרכיב ארוחה ולראות כמה היא יוצאת</p></div>
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
  const sub = !b.hasGoal
    ? `${c.items.length} פריטים`
    : after >= 0
      ? `יישארו ${fmt(after)} קל׳ להיום`
      : `חורג ב-${fmt(-after)} קל׳`;
  return `<div class="cart${b.hasGoal && after < 0 ? ' over' : ''}">
    <button type="button" class="cart-x" data-act="cart-clear" aria-label="ניקוי">✕</button>
    <button type="button" class="cart-txt" data-act="cart-open"><b>${fmt(c.kcal)} קל׳ · ${fmt1(c.protein)} ג׳ חלבון</b><small>${sub}</small></button>
    <button type="button" class="btn primary sm" data-act="cart-open">סיכום</button>
  </div>`;
}

// ---------- mount / update
export function renderView() {
  const view = $('#view');
  const tab = app.tab;
  if (view.dataset.tab !== tab) {
    view.dataset.tab = tab;
    view.innerHTML = tab === 'foods' ? foodsShell() : '';
    window.scrollTo(0, 0);
  }
  if (tab === 'today') {
    view.innerHTML = todayHTML();
    animate(view);
  } else if (tab === 'ideas') {
    view.innerHTML = ideasHTML();
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
  filter(el) {
    app.filter = el.dataset.f;
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
