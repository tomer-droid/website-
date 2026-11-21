// Shared by the browser (optimistic updates) and the API (source of truth).
// Every change to the shared state is an "op"; applying the same op twice is harmless.

export function emptyState() {
  return {
    v: 1,
    rev: 0,
    updatedAt: 0,
    profile: { name: '', kcalGoal: null, proteinGoal: null },
    days: {}, // 'YYYY-MM-DD' -> { entries: [{ id, at, kcal, protein, note }] }
    foods: {}, // food id -> edited / custom food (see cleanFood)
    meals: {}, // meal id -> custom idea, or { hidden: true } for a built-in one
  };
}

const num = (x, min, max, dec = 0) => {
  if (x === null || x === undefined || x === '') return null;
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  const p = 10 ** dec;
  return Math.round(Math.min(max, Math.max(min, n)) * p) / p;
};
const str = (x, max) =>
  typeof x === 'string' ? x.replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, max) : '';
const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const isId = (s) => typeof s === 'string' && /^[a-zA-Z0-9_-]{1,40}$/.test(s);

function cleanFood(d) {
  if (!d || typeof d !== 'object') return null;
  if (d.hidden) return { hidden: true };
  const name = str(d.name, 40);
  if (!name) return null;
  const qty = d.qty === 'gram' ? 'gram' : 'unit';
  const out = {
    name,
    cat: str(d.cat, 12) || 'other',
    qty,
    per: qty === 'gram' || d.per === '100g' ? '100g' : 'unit',
    kcal: num(d.kcal, 0, 2000, 1),
    protein: num(d.protein, 0, 500, 1),
    fat: num(d.fat, 0, 500, 1),
  };
  if (qty === 'unit') {
    out.unit = str(d.unit, 20) || 'יחידה';
    out.unitGrams = num(d.unitGrams, 0.1, 5000, 1);
  } else {
    out.step = num(d.step, 1, 500) || 50;
  }
  const note = str(d.note, 90);
  if (note) out.note = note;
  return out;
}

function cleanMeal(d) {
  if (!d || typeof d !== 'object') return null;
  if (d.hidden) return { hidden: true };
  const name = str(d.name, 50);
  if (!name || !Array.isArray(d.items)) return null;
  const items = [];
  for (const it of d.items.slice(0, 20)) {
    if (!Array.isArray(it) || !isId(it[0])) continue;
    if (!(Number(it[1]) > 0)) continue;
    items.push([it[0], num(it[1], 0.25, 5000, 2)]);
  }
  if (!items.length) return null;
  return { name, tag: d.tag === 'sweet' ? 'sweet' : 'meal', items };
}

export function applyOps(state, ops) {
  const s = state;
  s.profile ||= { name: '', kcalGoal: null, proteinGoal: null };
  s.days ||= {};
  s.foods ||= {};
  s.meals ||= {};
  for (const op of Array.isArray(ops) ? ops : []) {
    if (!op || typeof op !== 'object') continue;
    switch (op.t) {
      case 'profile': {
        if ('name' in op) s.profile.name = str(op.name, 24);
        if ('kcalGoal' in op) s.profile.kcalGoal = num(op.kcalGoal, 300, 15000);
        if ('proteinGoal' in op) s.profile.proteinGoal = num(op.proteinGoal, 0, 1000);
        break;
      }
      case 'addEntry': {
        if (!isDay(op.day) || !isId(op.id)) break;
        const kcal = num(op.kcal, -20000, 20000);
        if (kcal === null) break;
        const day = (s.days[op.day] ||= { entries: [] });
        if (day.entries.length >= 80 || day.entries.some((e) => e.id === op.id)) break;
        day.entries.push({
          id: op.id,
          at: num(op.at, 0, 4e12) || Date.now(),
          kcal,
          protein: num(op.protein, -2000, 2000, 1) || 0,
          note: str(op.note, 60),
        });
        break;
      }
      case 'delEntry': {
        const day = isDay(op.day) && s.days[op.day];
        if (day) day.entries = day.entries.filter((e) => e.id !== op.id);
        break;
      }
      case 'food': {
        if (!isId(op.id)) break;
        if (op.data === null || op.data === undefined) {
          delete s.foods[op.id];
          break;
        }
        const f = cleanFood(op.data);
        if (f && (s.foods[op.id] || Object.keys(s.foods).length < 300)) s.foods[op.id] = f;
        break;
      }
      case 'meal': {
        if (!isId(op.id)) break;
        if (op.data === null || op.data === undefined) {
          delete s.meals[op.id];
          break;
        }
        const m = cleanMeal(op.data);
        if (m && (s.meals[op.id] || Object.keys(s.meals).length < 150)) s.meals[op.id] = m;
        break;
      }
    }
  }
  const keys = Object.keys(s.days).sort();
  while (keys.length > 14) delete s.days[keys.shift()];
  return s;
}
