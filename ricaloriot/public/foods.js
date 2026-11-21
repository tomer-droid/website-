// The built-in food list and meal ideas.
//
// RULE: a calorie value is filled in here only when it is a stable, generic fact
// (an egg, olive oil, cooked rice...). Anything that depends on the brand, the fat
// percentage or the size (bread, yellow cheese, cottage, tortilla...) stays null:
// the couple fills it in once from the package, and it is saved for both of them.
//
// qty 'unit' -> counted in units (egg, slice). per 'unit' = values for one unit,
//               per '100g' = values per 100 g + unitGrams (weight of one unit).
// qty 'gram' -> counted in grams, values are always per 100 g; step = the +/- jump.

export const CATS = [
  ['protein', 'ביצים, עוף וחלבון'],
  ['dairy', 'גבינות ומוצרי חלב'],
  ['carb', 'לחם ופחמימות'],
  ['fat', 'שמנים'],
  ['veg', 'ירקות ופירות'],
  ['sweet', 'מתוקים'],
  ['other', 'אחר'],
];

const X = null; // "not known - fill in from the package"

export const FOODS = [
  // ---- eggs, chicken
  { id: 'egg', emoji: '🥚', name: 'ביצה', cat: 'protein', qty: 'unit', per: 'unit', unit: 'ביצה', one: 'ביצה', many: 'ביצים', kcal: 70, protein: 6, fat: 5, note: 'גודל M. ביצה L ≈ 85 קל׳' },
  { id: 'egg_white', emoji: '🥚', name: 'חלבון ביצה', cat: 'protein', qty: 'unit', per: 'unit', unit: 'חלבון', one: 'חלבון ביצה', many: 'חלבוני ביצה', kcal: 17, protein: 3.6, fat: 0.1, note: 'בלי החלמון' },
  { id: 'chicken_cooked', emoji: '🍗', name: 'חזה עוף מוכן', cat: 'protein', qty: 'gram', per: '100g', step: 50, kcal: 165, protein: 31, fat: 3.6, note: 'מבושל או צלוי, בלי עור. לא כולל שמן' },
  { id: 'chicken_raw', emoji: '🍗', name: 'חזה עוף נא', cat: 'protein', qty: 'gram', per: '100g', step: 50, kcal: 120, protein: 22.5, fat: 2.6, note: 'שוקלים לפני הבישול' },

  // ---- dairy (all brand / fat-% dependent)
  { id: 'cottage', emoji: '🥣', name: 'קוטג׳', cat: 'dairy', qty: 'gram', per: '100g', step: 50, kcal: X, protein: X, fat: X, note: 'תלוי באחוז השומן. גביע = 250 ג׳' },
  { id: 'yellow_cheese', emoji: '🧀', name: 'גבינה צהובה', cat: 'dairy', qty: 'unit', per: '100g', unit: 'פרוסה', one: 'פרוסת גבינה צהובה', many: 'פרוסות גבינה צהובה', kcal: X, protein: X, fat: X, unitGrams: X, note: 'תלוי באחוז השומן ובעובי הפרוסה' },
  { id: 'cream_cheese', emoji: '🧈', name: 'גבינת שמנת', cat: 'dairy', qty: 'gram', per: '100g', step: 10, kcal: X, protein: X, fat: X, note: 'תלוי באחוז השומן' },
  { id: 'white_cheese', emoji: '🥛', name: 'גבינה לבנה', cat: 'dairy', qty: 'gram', per: '100g', step: 50, kcal: X, protein: X, fat: X, note: 'תלוי באחוז השומן' },
  { id: 'cream', emoji: '🥛', name: 'שמנת', cat: 'dairy', qty: 'gram', per: '100g', step: 10, kcal: X, protein: X, fat: X, note: 'לבישול או חמוצה — לפי האחוזים שעל האריזה' },

  // ---- bread & carbs
  { id: 'bread', emoji: '🍞', name: 'לחם', cat: 'carb', qty: 'unit', per: '100g', unit: 'פרוסה', one: 'פרוסת לחם', many: 'פרוסות לחם', kcal: X, protein: X, fat: X, unitGrams: X, note: 'תלוי בסוג הלחם (רגיל, קל, מלא)' },
  { id: 'tortilla', emoji: '🫓', name: 'טורטיה', cat: 'carb', qty: 'unit', per: '100g', unit: 'טורטיה', one: 'טורטיה', many: 'טורטיות', kcal: X, protein: X, fat: X, unitGrams: X, note: 'תלוי בגודל ובמותג' },
  { id: 'rice_paper', emoji: '🥟', name: 'דפי אורז', cat: 'carb', qty: 'unit', per: '100g', unit: 'דף', one: 'דף אורז', many: 'דפי אורז', kcal: X, protein: X, fat: X, unitGrams: X, note: 'תלוי בגודל הדף' },
  { id: 'bourekas', emoji: '🥐', name: 'בורקס', cat: 'carb', qty: 'unit', per: '100g', unit: 'בורקס', one: 'בורקס', many: 'בורקסים', kcal: X, protein: X, fat: X, unitGrams: X, note: 'תלוי בגודל ובמילוי' },
  { id: 'rice', emoji: '🍚', name: 'אורז לבן מבושל', cat: 'carb', qty: 'gram', per: '100g', step: 50, kcal: 130, protein: 2.7, fat: 0.3, note: 'כוס אורז מבושל ≈ 160 ג׳' },
  { id: 'pasta', emoji: '🍝', name: 'פסטה מבושלת', cat: 'carb', qty: 'gram', per: '100g', step: 50, kcal: 158, protein: 5.8, fat: 0.9, note: 'שוקלים אחרי הבישול, בלי רוטב' },
  { id: 'potato_raw', emoji: '🥔', name: 'תפוח אדמה נא', cat: 'carb', qty: 'gram', per: '100g', step: 50, kcal: 77, protein: 2, fat: 0.1, note: 'עם קליפה או בלי — כמעט אותו ערך ל-100 ג׳' },
  { id: 'potato_boiled', emoji: '🥔', name: 'תפוח אדמה מבושל', cat: 'carb', qty: 'gram', per: '100g', step: 50, kcal: 86, protein: 1.7, fat: 0.1, note: 'קלוף, שוקלים אחרי הבישול' },
  { id: 'sweet_potato', emoji: '🍠', name: 'בטטה נא', cat: 'carb', qty: 'gram', per: '100g', step: 50, kcal: 86, protein: 1.6, fat: 0.1, note: 'שוקלים לפני הבישול' },

  // ---- oils
  { id: 'olive_oil', emoji: '🫒', name: 'שמן זית', cat: 'fat', qty: 'unit', per: 'unit', unit: 'כפית', one: 'כפית שמן זית', many: 'כפיות שמן זית', kcal: 40, protein: 0, fat: 4.5, note: 'כף = 3 כפיות ≈ 120 קל׳' },
  { id: 'oil_spray', emoji: '💨', name: 'ספריי שמן זית', cat: 'fat', qty: 'unit', per: 'unit', unit: 'שנייה', one: 'שנייה של ספריי שמן', many: 'שניות של ספריי שמן', kcal: X, protein: 0, fat: X, note: 'תלוי במותג. בדרך כלל 7–9 קל׳ לשנייה של ריסוס' },
  { id: 'butter', emoji: '🧈', name: 'חמאה', cat: 'fat', qty: 'gram', per: '100g', step: 5, kcal: 717, protein: 0.9, fat: 81, note: 'כפית ≈ 5 ג׳ ≈ 36 קל׳' },

  // ---- vegetables & fruit
  { id: 'tomato', emoji: '🍅', name: 'עגבנייה', cat: 'veg', qty: 'unit', per: 'unit', unit: 'עגבנייה', one: 'עגבנייה', many: 'עגבניות', kcal: 22, protein: 1.1, fat: 0.2, note: 'בינונית' },
  { id: 'cucumber', emoji: '🥒', name: 'מלפפון', cat: 'veg', qty: 'unit', per: 'unit', unit: 'מלפפון', one: 'מלפפון', many: 'מלפפונים', kcal: 16, protein: 0.7, fat: 0.1 },
  { id: 'avocado', emoji: '🥑', name: 'אבוקדו', cat: 'veg', qty: 'gram', per: '100g', step: 25, kcal: 160, protein: 2, fat: 14.7 },
  { id: 'olives', emoji: '🫒', name: 'זיתים', cat: 'veg', qty: 'unit', per: 'unit', unit: 'זית', one: 'זית', many: 'זיתים', kcal: X, protein: X, fat: X, note: 'תלוי בסוג ובגודל' },
  { id: 'banana', emoji: '🍌', name: 'בננה', cat: 'veg', qty: 'unit', per: 'unit', unit: 'בננה', one: 'בננה', many: 'בננות', kcal: 105, protein: 1.3, fat: 0.4, note: 'בינונית' },
  { id: 'apple', emoji: '🍎', name: 'תפוח', cat: 'veg', qty: 'unit', per: 'unit', unit: 'תפוח', one: 'תפוח', many: 'תפוחים', kcal: 95, protein: 0.5, fat: 0.3, note: 'בינוני' },

  // ---- sweets
  { id: 'nutella', emoji: '🍫', name: 'נוטלה', cat: 'sweet', qty: 'gram', per: '100g', step: 5, kcal: 539, protein: 6.3, fat: 30.9, note: 'כפית גדושה ≈ 15 ג׳ ≈ 80 קל׳' },
  { id: 'chocolate', emoji: '🍫', name: 'שוקולד חלב', cat: 'sweet', qty: 'gram', per: '100g', step: 5, kcal: X, protein: X, fat: X, note: 'לפי העטיפה של השוקולד שלכם' },
  { id: 'chocolate_dark', emoji: '🍫', name: 'שוקולד מריר', cat: 'sweet', qty: 'gram', per: '100g', step: 5, kcal: X, protein: X, fat: X, note: 'תלוי באחוז הקקאו — לפי העטיפה' },

  // ---- other
  { id: 'pizza_sauce', emoji: '🥫', name: 'רוטב פיצה', cat: 'other', qty: 'gram', per: '100g', step: 10, kcal: X, protein: X, fat: X, note: 'לפי האריזה' },
];

// items: [food id, quantity]  (units, or grams for gram foods)
// The first block uses only foods with known values, so it works from day one and
// covers every calorie level; the second block opens up once the couple fills in their products.
export const MEALS = [
  // ---- light (up to ~250)
  { id: 'boiled_eggs', name: 'ביצים קשות וירקות', items: [['egg', 2], ['tomato', 1], ['cucumber', 1]] },
  { id: 'whites_omelet', name: 'חביתת חלבונים עם ירקות', items: [['egg', 1], ['egg_white', 4], ['tomato', 1], ['cucumber', 1], ['olive_oil', 1]] },
  { id: 'banana_nutella', name: 'בננה עם כפית נוטלה', tag: 'sweet', items: [['banana', 1], ['nutella', 15]] },
  { id: 'nutella_spoon', name: 'כפית נוטלה', tag: 'sweet', items: [['nutella', 15]] },
  // ---- ~300
  { id: 'omelet_veg', name: 'חביתה מ-3 ביצים וירקות', items: [['egg', 3], ['olive_oil', 1], ['tomato', 1], ['cucumber', 1]] },
  { id: 'chicken_rice_small', name: 'חזה עוף עם אורז — מנה קטנה', items: [['chicken_cooked', 100], ['rice', 100]] },
  { id: 'chicken_salad', name: 'חזה עוף עם סלט ירקות', items: [['chicken_cooked', 150], ['tomato', 1], ['cucumber', 1], ['olive_oil', 1]] },
  // ---- ~400
  { id: 'eggs_rice', name: 'אורז עם 2 ביצי עין', items: [['rice', 200], ['egg', 2], ['olive_oil', 1]] },
  { id: 'omelet_potato', name: 'חביתה מ-3 ביצים עם תפוחי אדמה', items: [['egg', 3], ['potato_boiled', 200], ['olive_oil', 1]] },
  { id: 'chicken_potato_small', name: 'חזה עוף עם תפוחי אדמה — מנה קטנה', items: [['chicken_cooked', 120], ['potato_boiled', 200], ['olive_oil', 1]] },
  // ---- ~500
  { id: 'chicken_rice', name: 'חזה עוף עם אורז', items: [['chicken_cooked', 150], ['rice', 150], ['olive_oil', 1]] },
  { id: 'chicken_potato', name: 'חזה עוף עם תפוחי אדמה', items: [['chicken_cooked', 150], ['potato_boiled', 250], ['olive_oil', 1]] },
  { id: 'pasta_chicken', name: 'פסטה עם חזה עוף', items: [['pasta', 200], ['chicken_cooked', 100], ['olive_oil', 1]] },
  { id: 'eggs_rice_avocado', name: 'אורז, 3 ביצים ואבוקדו', items: [['rice', 150], ['egg', 3], ['avocado', 50]] },
  // ---- ~600
  { id: 'chicken_rice_avocado', name: 'חזה עוף, אורז ואבוקדו', items: [['chicken_cooked', 150], ['rice', 200], ['avocado', 50]] },
  { id: 'eggs_rice_big', name: 'אורז עם 3 ביצי עין — מנה גדולה', items: [['rice', 250], ['egg', 3], ['olive_oil', 1]] },
  { id: 'pasta_chicken_big', name: 'פסטה עם חזה עוף — מנה גדולה', items: [['pasta', 250], ['chicken_cooked', 120], ['olive_oil', 1]] },
  // ---- ~700 and up
  { id: 'chicken_potato_big', name: 'חזה עוף עם תפוחי אדמה — מנה גדולה', items: [['chicken_cooked', 200], ['potato_boiled', 300], ['olive_oil', 2]] },
  { id: 'chicken_rice_big', name: 'חזה עוף עם אורז — מנה גדולה', items: [['chicken_cooked', 200], ['rice', 250], ['olive_oil', 2]] },
  { id: 'chicken_rice_xl', name: 'חזה עוף עם אורז — מנה ענקית', items: [['chicken_cooked', 200], ['rice', 300], ['olive_oil', 2]] },

  // ---- the usual evening things: need the couple's own products (bread, cheese, tortilla...)
  { id: 'toast_cheese', name: 'טוסט גבינה צהובה', items: [['bread', 2], ['yellow_cheese', 2], ['butter', 5]] },
  { id: 'toast_pizza', name: 'טוסט פיצה', items: [['bread', 2], ['yellow_cheese', 2], ['pizza_sauce', 30], ['olives', 4]] },
  { id: 'tortilla_pizza', name: 'פיצה על טורטיה', items: [['tortilla', 1], ['pizza_sauce', 40], ['yellow_cheese', 2], ['olives', 4]] },
  { id: 'tortilla_egg', name: 'טורטיה עם חביתה וגבינה', items: [['tortilla', 1], ['egg', 2], ['yellow_cheese', 1], ['oil_spray', 1]] },
  { id: 'omelet_bread_cottage', name: 'חביתה, לחם וקוטג׳', items: [['egg', 2], ['bread', 2], ['cottage', 100], ['olive_oil', 1]] },
  { id: 'omelet_cottage', name: 'חביתה מ-3 ביצים, קוטג׳ וירקות', items: [['egg', 3], ['cottage', 125], ['tomato', 1], ['cucumber', 1], ['olive_oil', 1]] },
  { id: 'cottage_plate', name: 'קוטג׳, לחם וירקות', items: [['cottage', 125], ['bread', 2], ['tomato', 1], ['cucumber', 1]] },
  { id: 'avocado_toast', name: 'לחם עם אבוקדו וביצים', items: [['bread', 2], ['avocado', 50], ['egg', 2]] },
  { id: 'rice_paper_egg', name: 'דפי אורז עם ביצה וגבינה', items: [['rice_paper', 2], ['egg', 2], ['yellow_cheese', 1], ['oil_spray', 1]] },
  { id: 'bourekas_egg', name: 'בורקס עם ביצה קשה', items: [['bourekas', 2], ['egg', 1], ['tomato', 1]] },
  { id: 'baked_potato', name: 'תפוח אדמה אפוי עם חמאה וקוטג׳', items: [['potato_raw', 300], ['butter', 10], ['cottage', 100]] },
  { id: 'pasta_cream', name: 'פסטה ברוטב שמנת', items: [['pasta', 200], ['cream', 50], ['yellow_cheese', 1]] },
  { id: 'nutella_bread', name: 'לחם עם נוטלה', tag: 'sweet', items: [['bread', 1], ['nutella', 15]] },
  { id: 'nutella_tortilla', name: 'טורטיה עם נוטלה ובננה', tag: 'sweet', items: [['tortilla', 1], ['nutella', 20], ['banana', 1]] },
  { id: 'dark_choc', name: 'שוקולד מריר — 20 גרם', tag: 'sweet', items: [['chocolate_dark', 20]] },
  { id: 'milk_choc', name: 'שוקולד חלב — 25 גרם', tag: 'sweet', items: [['chocolate', 25]] },
];

/** Built-in foods merged with the couple's edits, plus their own foods. Map id -> food */
export function getFoods(state) {
  const out = new Map();
  const saved = state.foods || {};
  for (const f of FOODS) {
    const o = saved[f.id];
    if (!o) out.set(f.id, f);
    else if (!o.hidden) {
      const m = { ...f, ...o, id: f.id, emoji: f.emoji, edited: true };
      if (o.name !== f.name || o.qty !== f.qty) {
        delete m.one;
        delete m.many;
      }
      if (!o.note) delete m.note;
      out.set(f.id, m);
    }
  }
  for (const [id, o] of Object.entries(saved)) {
    if (!out.has(id) && !o.hidden && id.startsWith('c_')) out.set(id, { emoji: '🍽️', ...o, id, custom: true });
  }
  return out;
}

/** Calories / protein / fat for ONE counting step (1 unit, or 1 gram). null = data missing. */
export function perOne(f) {
  if (f.kcal === null || f.kcal === undefined) return null;
  let k = 1;
  if (f.qty === 'gram') k = 0.01;
  else if (f.per === '100g') {
    if (!f.unitGrams) return null;
    k = f.unitGrams / 100;
  }
  const fat = f.fat === null || f.fat === undefined ? null : f.fat * k;
  return { kcal: f.kcal * k, protein: (f.protein || 0) * k, fat };
}

export const isMissing = (f) => perOne(f) === null;

export function amount(f, q) {
  const p = perOne(f);
  return p && { kcal: p.kcal * q, protein: p.protein * q, fat: p.fat === null ? null : p.fat * q };
}

const q2 = (q) => (Math.round(q * 100) / 100).toLocaleString('en-US');

/** "2 פרוסות לחם", "200 ג׳ אורז לבן מבושל" */
export function qtyText(f, q) {
  if (f.qty === 'gram') return `${q2(q)} ג׳ ${f.name}`;
  if (f.one && q === 1) return f.one;
  if (f.many && q !== 1) return `${q2(q)} ${f.many}`;
  return q === 1 ? f.name : `${f.name} × ${q2(q)}`;
}

/** Totals for a list of [food id, qty]. null if a food no longer exists. fat is null when unknown. */
export function mealCalc(items, foods) {
  let kcal = 0;
  let protein = 0;
  let fat = 0;
  const missing = [];
  const rows = [];
  for (const [id, q] of items) {
    const f = foods.get(id);
    if (!f) return null;
    const a = amount(f, q);
    if (a) {
      kcal += a.kcal;
      protein += a.protein;
      fat = fat === null || a.fat === null ? null : fat + a.fat;
    } else missing.push(f);
    rows.push({ f, q, a });
  }
  return { kcal, protein, fat: missing.length ? null : fat, missing, rows };
}

/** Built-in ideas that were not removed + the couple's saved ideas. */
export function getMeals(state) {
  const saved = state.meals || {};
  const out = MEALS.filter((m) => !saved[m.id]?.hidden);
  for (const [id, m] of Object.entries(saved)) {
    if (m.items && !MEALS.some((b) => b.id === id)) out.unshift({ ...m, id, custom: true });
  }
  return out;
}
