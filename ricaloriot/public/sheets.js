// Bottom sheets: add what was eaten, goals/settings, an idea, the built meal, a food's values.
import {
  app, on, onForm, $, esc, fmt, fmt1, round1, uid, parseNum, budget, totals, todayKey,
  dispatch, render, saveFlags, saveCart, toast, lock,
} from './core.js';
import { CATS, FOODS, getFoods, getMeals, mealCalc, isMissing, qtyText } from './foods.js';
import { cartCalc, missingFoods } from './views.js';

const root = $('#sheet-root');
let closeTimer = 0;

export function openSheet(html) {
  clearTimeout(closeTimer);
  root.innerHTML = `<div class="backdrop" data-act="close"></div>
    <section class="sheet" role="dialog" aria-modal="true">
      <button type="button" class="sheet-x" data-act="close" aria-label="סגירה">✕</button>${html}
    </section>`;
  root.classList.add('open');
  document.body.classList.add('locked');
  void root.offsetWidth;
  root.classList.add('in');
}

export function closeSheet() {
  root.classList.remove('in');
  document.body.classList.remove('locked');
  document.activeElement?.blur?.();
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    root.classList.remove('open');
    root.innerHTML = '';
  }, 260);
}

// keep the sheet above the on-screen keyboard
if (window.visualViewport) {
  const fit = () => {
    const vv = window.visualViewport;
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    root.style.setProperty('--kb', (kb > 80 ? kb : 0) + 'px');
  };
  visualViewport.addEventListener('resize', fit);
  visualViewport.addEventListener('scroll', fit);
}

const shake = (el) => {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  el.querySelector('input')?.focus();
};

// ---------- "I ate something"
const NOTES = ['בוקר', 'צהריים', 'ערב', 'נשנוש'];

function entrySheet(mode = app.flags.entryMode || 'add') {
  const t = totals();
  const h = new Date().getHours();
  const def = h < 5 ? 'נשנוש' : h < 11 ? 'בוקר' : h < 16 ? 'צהריים' : 'ערב';
  const total = mode === 'total';
  openSheet(`<form class="sheet-body" data-form="entry" data-mode="${mode}" novalidate>
    <h2>מה אכלת?</h2>
    <div class="seg">
      <button type="button" class="${total ? '' : 'on'}" data-act="entry-mode" data-mode="add">מה שאכלתי עכשיו</button>
      <button type="button" class="${total ? 'on' : ''}" data-act="entry-mode" data-mode="total">סה״כ של היום</button>
    </div>
    <p class="help">${
      total
        ? 'מעתיקים את הסה״כ מ-MyFitnessPal — וההפרש מתעדכן לבד.'
        : 'מוסיפים רק את מה שנאכל עכשיו. זה מצטרף למה שכבר רשום.'
    }</p>
    <div class="fields2">
      <label class="field kcal"><span>קלוריות</span>
        <input id="e-kcal" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="0" value="${total && t.kcal ? t.kcal : ''}"></label>
      <label class="field protein"><span>חלבון (גרם)</span>
        <input id="e-protein" inputmode="decimal" autocomplete="off" placeholder="0" value="${total && t.protein ? t.protein : ''}"></label>
    </div>
    ${
      total
        ? ''
        : `<div class="chips">${NOTES.map(
            (n) => `<button type="button" class="chip${n === def ? ' on' : ''}" data-act="pick-chip" data-v="${n}">${n}</button>`,
          ).join('')}</div>`
    }
    <button type="submit" class="btn primary big">שמירה</button>
  </form>`);
  $('#e-kcal').focus();
  if (total) $('#e-kcal').select();
}

on({
  'add-entry': () => entrySheet(),
  'entry-mode'(el) {
    saveFlags({ entryMode: el.dataset.mode });
    entrySheet(el.dataset.mode);
  },
  'pick-chip'(el) {
    el.parentElement.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === el));
  },
  'del-entry'(el) {
    const day = todayKey();
    const entry = totals().entries.find((e) => e.id === el.dataset.id);
    if (!entry) return;
    dispatch({ t: 'delEntry', day, id: entry.id });
    toast('הרישום נמחק', { action: 'ביטול', onAction: () => dispatch({ t: 'addEntry', day, ...entry }) });
  },
  close: () => closeSheet(),
});

onForm({
  entry(form) {
    const kRaw = $('#e-kcal').value.trim();
    const pRaw = $('#e-protein').value.trim();
    let kcal = parseNum(kRaw);
    let protein = parseNum(pRaw);
    if (kcal === null && protein === null) return shake($('#e-kcal').closest('.field'));
    let note = form.querySelector('.chip.on')?.dataset.v || '';
    if (form.dataset.mode === 'total') {
      const t = totals();
      kcal = kcal === null ? 0 : kcal - t.kcal;
      protein = protein === null ? 0 : protein - t.protein;
      note = 'עדכון סה״כ';
      if (!Math.round(kcal) && !round1(protein)) return closeSheet();
    }
    dispatch({
      t: 'addEntry',
      day: todayKey(),
      id: uid(),
      at: Date.now(),
      kcal: Math.round(kcal || 0),
      protein: round1(protein || 0),
      note,
    });
    closeSheet();
    const b = budget();
    toast(b.hasGoal && b.left >= 0 ? `נרשם ✓ נשארו ${fmt(b.left)} קל׳` : 'נרשם ✓');
  },
});

// ---------- goals + settings
function settingsSheet(first = false) {
  const p = app.state.profile || {};
  const link = `${location.origin}/?k=${encodeURIComponent(app.code)}`;
  openSheet(`<form class="sheet-body" data-form="profile" novalidate>
    <h2>${first ? 'מתחילים: מה היעד היומי?' : 'היעד היומי'}</h2>
    ${first ? '<p class="help">מגדירים פעם אחת. אפשר לשנות מתי שרוצים דרך גלגל השיניים.</p>' : ''}
    <div class="fields2">
      <label class="field kcal"><span>קלוריות ביום</span>
        <input id="p-kcal" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="2600" value="${p.kcalGoal || ''}"></label>
      <label class="field protein"><span>חלבון ביום (גרם)</span>
        <input id="p-protein" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="150" value="${p.proteinGoal || ''}"></label>
    </div>
    <label class="field sm"><span>של מי היעד? (לא חובה)</span>
      <input id="p-name" type="text" autocomplete="off" maxlength="24" placeholder="השם שיופיע במסך הראשי" value="${esc(p.name || '')}"></label>
    <button type="submit" class="btn primary big">שמירה</button>
  </form>
  ${
    first
      ? ''
      : `<div class="settings">
    <h3>שיתוף</h3>
    <p class="help">שולחים את הקישור — מי שפותח אותו רואה ומעדכן את אותם נתונים, בזמן אמת.</p>
    <button type="button" class="btn wide" data-act="share" data-link="${esc(link)}">שליחת הקישור</button>
    <p class="help">קוד הכניסה: <b class="code">${esc(app.code)}</b></p>
    <h3>התקנה בטלפון</h3>
    <p class="help"><b>אייפון:</b> פותחים בספארי ← כפתור השיתוף ← ״הוספה למסך הבית״.<br><b>אנדרואיד:</b> בכרום ← תפריט ⋮ ← ״התקנת האפליקציה״.</p>
    <button type="button" class="btn ghost wide" data-act="logout">ניתוק המכשיר הזה</button>
  </div>`
  }`);
  if (first) $('#p-kcal').focus();
}

on({
  settings: () => settingsSheet(false),
  async share(el) {
    const url = el.dataset.link;
    try {
      if (navigator.share) await navigator.share({ title: 'Ricaloriot', text: 'כמה נשאר לאכול היום', url });
      else {
        await navigator.clipboard.writeText(url);
        toast('הקישור הועתק');
      }
    } catch {}
  },
  logout() {
    closeSheet();
    lock();
  },
  'install-dismiss'() {
    saveFlags({ installDismissed: true });
    render();
  },
});

onForm({
  profile() {
    const kcal = parseNum($('#p-kcal').value);
    const protein = parseNum($('#p-protein').value);
    if (kcal === null || kcal < 300 || kcal > 15000) return shake($('#p-kcal').closest('.field'));
    dispatch({ t: 'profile', kcalGoal: Math.round(kcal), proteinGoal: protein ? Math.round(protein) : null, name: $('#p-name').value });
    closeSheet();
    toast('היעד נשמר ✓');
  },
});

export const openFirstRun = () => settingsSheet(true);

// ---------- an idea / the built meal
function mealBody(title, c, buttons) {
  const b = budget();
  const rows = c.rows
    .map(
      (r) => `<li><span>${esc(qtyText(r.f, r.q))}</span>${
        r.a
          ? `<b>${fmt(r.a.kcal)} קל׳</b>`
          : `<button type="button" class="fill" data-act="food-edit" data-id="${esc(r.f.id)}">השלמה</button>`
      }</li>`,
    )
    .join('');
  const ready = !c.missing.length;
  let after = '';
  if (ready && b.hasGoal) {
    const k = b.left - c.kcal;
    const p = b.pLeft - c.protein;
    after =
      k >= 0
        ? `אחרי זה יישארו <b>${fmt(k)} קל׳</b>${b.proteinGoal ? (p > 0 ? ` ו-<b>${fmt(p)} ג׳ חלבון</b>` : ' והחלבון סגור') : ''}.`
        : `זה חורג ב-<b>${fmt(-k)} קל׳</b> ממה שנשאר להיום.`;
  }
  return `<div class="sheet-body">
    <h2>${esc(title)}</h2>
    <ul class="ing-list">${rows}</ul>
    <div class="sum2">
      <div class="kcal"><b>${ready ? fmt(c.kcal) : '?'}</b><span>קלוריות</span></div>
      <div class="protein"><b>${ready ? fmt(c.protein) : '?'}</b><span>גרם חלבון</span></div>
    </div>
    ${
      ready
        ? after && `<p class="help after">${after}</p>`
        : '<p class="help after">חסרים נתונים לחלק מהמוצרים. משלימים פעם אחת מהאריזה — והרעיון נפתח.</p>'
    }
    ${buttons(ready)}
  </div>`;
}

const logMeal = (name, c) =>
  dispatch({
    t: 'addEntry',
    day: todayKey(),
    id: uid(),
    at: Date.now(),
    kcal: Math.round(c.kcal),
    protein: round1(c.protein),
    note: name,
  });

function ideaSheet(id) {
  const m = getMeals(app.state).find((x) => x.id === id);
  const c = m && mealCalc(m.items, getFoods(app.state));
  if (!c) return;
  const mid = esc(id);
  openSheet(
    mealBody(
      m.name,
      c,
      (ready) => `${ready ? `<button type="button" class="btn primary big" data-act="idea-log" data-id="${mid}">אכלתי את זה — לרשום</button>` : ''}
      <div class="row2">
        <button type="button" class="btn" data-act="idea-cart" data-id="${mid}">שינוי כמויות</button>
        <button type="button" class="btn ghost" data-act="idea-hide" data-id="${mid}">הסרת הרעיון</button>
      </div>`,
    ),
  );
}

function cartSheet() {
  const c = cartCalc();
  if (!c.items.length) return;
  openSheet(
    mealBody(
      'הארוחה שהרכבת',
      c,
      () => `<button type="button" class="btn primary big" data-act="cart-log">אכלתי את זה — לרשום</button>
      <form class="save-idea" data-form="save-idea" novalidate>
        <label class="field sm"><span>לשמור כרעיון קבוע? נותנים שם</span>
          <input id="idea-name" type="text" maxlength="50" autocomplete="off" placeholder="למשל: הטוסט של שישי"></label>
        <button type="submit" class="btn">שמירה</button>
      </form>`,
    ),
  );
}

on({
  idea: (el) => ideaSheet(el.dataset.id),
  'idea-log'(el) {
    const m = getMeals(app.state).find((x) => x.id === el.dataset.id);
    const c = m && mealCalc(m.items, getFoods(app.state));
    if (!c || c.missing.length) return;
    logMeal(m.name, c);
    closeSheet();
    app.tab = 'today';
    render();
    toast('נרשם ✓');
  },
  'idea-cart'(el) {
    const m = getMeals(app.state).find((x) => x.id === el.dataset.id);
    if (!m) return;
    app.cart = Object.fromEntries(m.items);
    saveCart();
    app.tab = 'foods';
    app.search = '';
    closeSheet();
    render();
  },
  'idea-hide'(el) {
    const id = el.dataset.id;
    const custom = app.state.meals?.[id];
    const builtin = !custom || custom.hidden;
    dispatch({ t: 'meal', id, data: builtin ? { hidden: true } : null });
    closeSheet();
    toast('הרעיון הוסר', { action: 'ביטול', onAction: () => dispatch({ t: 'meal', id, data: builtin ? null : custom }) });
  },
  'cart-open': () => cartSheet(),
  'cart-clear'() {
    const old = app.cart;
    app.cart = {};
    saveCart();
    render();
    toast('הארוחה נוקתה', {
      action: 'ביטול',
      onAction: () => {
        app.cart = old;
        saveCart();
        render();
      },
    });
  },
  'cart-log'() {
    const c = cartCalc();
    if (!c.items.length) return;
    logMeal(c.rows.map((r) => qtyText(r.f, r.q)).join(', '), c);
    app.cart = {};
    saveCart();
    closeSheet();
    app.tab = 'today';
    render();
    toast('נרשם ✓');
  },
});

onForm({
  'save-idea'() {
    const name = $('#idea-name').value.trim();
    if (!name) return shake($('#idea-name').closest('.field'));
    const c = cartCalc();
    dispatch({ t: 'meal', id: 'm_' + uid(), data: { name, tag: 'meal', items: c.items } });
    closeSheet();
    toast('נשמר ברעיונות ✓');
  },
});

// ---------- a food's values (also: the one-time "fill in from the package" flow)
let draft = null;
const skipped = new Set();

function foodSheet(id, flow = false) {
  const f = id ? getFoods(app.state).get(id) : null;
  if (id && !f) return;
  draft = f
    ? {
        id, flow, isNew: false, custom: !!f.custom, edited: !!f.edited, wasMissing: isMissing(f),
        name: f.name, cat: f.cat, qty: f.qty, unit: f.unit || 'יחידה', per: f.qty === 'gram' ? '100g' : f.per,
        kcal: f.kcal ?? '', protein: f.protein ?? '', unitGrams: f.unitGrams ?? '', step: f.step || 50, note: f.note || '',
      }
    : {
        id: 'c_' + uid(), flow: false, isNew: true, custom: true, name: '', cat: 'other', qty: 'unit', unit: 'יחידה',
        per: 'unit', kcal: '', protein: '', unitGrams: '', step: 50, note: '',
      };
  openSheet(foodForm());
  if (draft.isNew) $('[data-d="name"]').focus();
}

function foodForm() {
  const d = draft;
  const unit = d.qty === 'unit';
  const per100 = !unit || d.per === '100g';
  const left = d.flow ? missingFoods().filter((f) => f.id !== d.id && !skipped.has(f.id)).length : 0;
  return `<form class="sheet-body" data-form="food" novalidate>
    <h2>${d.isNew ? 'מאכל חדש' : esc(d.name)}</h2>
    ${d.wasMissing ? `<p class="help">${esc(d.note || 'מעתיקים מהאריזה פעם אחת — ונשמר לשניכם.')}</p>` : ''}
    ${
      d.isNew || d.custom
        ? `<label class="field sm"><span>שם המאכל</span><input data-d="name" type="text" maxlength="40" autocomplete="off" value="${esc(d.name)}"></label>
      <label class="field sm"><span>קטגוריה</span><select data-d="cat">${CATS.map(
        ([c, t]) => `<option value="${c}"${c === d.cat ? ' selected' : ''}>${t}</option>`,
      ).join('')}</select></label>`
        : ''
    }
    ${
      d.custom
        ? `<div class="seg">
      <button type="button" class="${unit ? 'on' : ''}" data-act="food-seg" data-key="qty" data-v="unit">סופרים יחידות</button>
      <button type="button" class="${unit ? '' : 'on'}" data-act="food-seg" data-key="qty" data-v="gram">שוקלים בגרמים</button>
    </div>`
        : ''
    }
    ${
      unit
        ? `<label class="field sm"><span>מה היחידה? (פרוסה, כפית, יחידה…)</span><input data-d="unit" type="text" maxlength="20" autocomplete="off" value="${esc(d.unit)}"></label>
      <div class="seg">
        <button type="button" class="${per100 ? 'on' : ''}" data-act="food-seg" data-key="per" data-v="100g">ערכים ל-100 גרם</button>
        <button type="button" class="${per100 ? '' : 'on'}" data-act="food-seg" data-key="per" data-v="unit">ערכים ליחידה אחת</button>
      </div>`
        : ''
    }
    <div class="fields2">
      <label class="field kcal"><span>קלוריות ${per100 ? 'ל-100 ג׳' : 'ליחידה'}</span>
        <input data-d="kcal" inputmode="decimal" autocomplete="off" placeholder="—" value="${esc(d.kcal)}"></label>
      <label class="field protein"><span>חלבון ${per100 ? 'ל-100 ג׳' : 'ליחידה'}</span>
        <input data-d="protein" inputmode="decimal" autocomplete="off" placeholder="—" value="${esc(d.protein)}"></label>
    </div>
    ${
      unit && per100
        ? `<label class="field sm"><span>כמה גרם שוקלת יחידה אחת?</span>
        <input data-d="unitGrams" inputmode="decimal" autocomplete="off" placeholder="למשל 30" value="${esc(d.unitGrams)}"></label>`
        : ''
    }
    <p class="preview" id="food-preview">${foodPreview()}</p>
    <button type="submit" class="btn primary big">${d.flow && left ? 'שמירה והבא' : 'שמירה'}</button>
    <div class="row2">
      ${d.flow && left ? '<button type="button" class="btn ghost" data-act="food-skip">דילוג</button>' : ''}
      ${
        d.isNew
          ? ''
          : d.custom
            ? '<button type="button" class="btn ghost" data-act="food-remove">מחיקת המאכל</button>'
            : `${d.edited ? '<button type="button" class="btn ghost" data-act="food-reset">איפוס</button>' : ''}
               <button type="button" class="btn ghost" data-act="food-remove">הסרה מהרשימה</button>`
      }
    </div>
  </form>`;
}

function foodPreview() {
  const d = draft;
  const kcal = parseNum(d.kcal);
  if (kcal === null) return '';
  const prot = parseNum(d.protein) || 0;
  if (d.qty === 'gram') return `50 ג׳ = <b>${fmt(kcal / 2)} קל׳</b> · ${fmt1(prot / 2)} ג׳ חלבון`;
  let k = 1;
  if (d.per === '100g') {
    const g = parseNum(d.unitGrams);
    if (!g) return 'חסר רק המשקל של יחידה אחת';
    k = g / 100;
  }
  return `${esc(d.unit || 'יחידה')} = <b>${fmt(kcal * k)} קל׳</b> · ${fmt1(prot * k)} ג׳ חלבון`;
}

const nextMissing = (afterId) => missingFoods().find((f) => f.id !== afterId && !skipped.has(f.id));

function afterFood(id) {
  const next = draft?.flow && nextMissing(id);
  if (next) return foodSheet(next.id, true);
  closeSheet();
  if (draft?.flow && !missingFoods().length) toast('כל הנתונים הושלמו ✓');
}

root.addEventListener('input', (ev) => {
  const key = ev.target.dataset?.d;
  if (!key || !draft) return;
  draft[key] = ev.target.value;
  const pv = $('#food-preview');
  if (pv) pv.innerHTML = foodPreview();
});

on({
  'food-edit': (el) => foodSheet(el.dataset.id),
  'food-new': () => foodSheet(null),
  'fill-next'() {
    skipped.clear();
    const next = nextMissing();
    if (next) foodSheet(next.id, true);
  },
  'food-seg'(el) {
    draft[el.dataset.key] = el.dataset.v;
    $('.sheet', root).innerHTML = `<button type="button" class="sheet-x" data-act="close" aria-label="סגירה">✕</button>${foodForm()}`;
  },
  'food-skip'() {
    skipped.add(draft.id);
    afterFood(draft.id);
  },
  'food-reset'() {
    dispatch({ t: 'food', id: draft.id, data: null });
    closeSheet();
    toast('חזר לערכי ברירת המחדל');
  },
  'food-remove'() {
    const { id, custom } = draft;
    const old = app.state.foods?.[id] || null;
    dispatch({ t: 'food', id, data: custom ? null : { hidden: true } });
    delete app.cart[id];
    saveCart();
    closeSheet();
    toast('המאכל הוסר', { action: 'ביטול', onAction: () => dispatch({ t: 'food', id, data: custom ? old : old?.hidden ? null : old }) });
  },
});

onForm({
  food() {
    const d = draft;
    const field = (key) => $(`[data-d="${key}"]`)?.closest('.field');
    const name = d.name.trim();
    if (!name) return shake(field('name'));
    const kcal = parseNum(d.kcal);
    if (kcal === null || kcal < 0) return shake(field('kcal'));
    const unit = d.qty === 'unit';
    const per = unit ? d.per : '100g';
    const grams = parseNum(d.unitGrams);
    if (unit && per === '100g' && !grams) return shake(field('unitGrams'));
    const builtin = FOODS.find((f) => f.id === d.id);
    dispatch({
      t: 'food',
      id: d.id,
      data: {
        name, cat: d.cat, qty: d.qty, per, kcal, protein: parseNum(d.protein) ?? 0,
        unit: d.unit, unitGrams: per === '100g' ? grams : null, step: builtin?.step || d.step,
        note: d.wasMissing ? '' : d.note,
      },
    });
    toast('נשמר ✓');
    afterFood(d.id);
  },
});
