// controllers/foodRecommendationController.js
// AI-first food recommendations based on user's available inventory.
// Falls back to a local rule-based scorer if AI fails or no key.

const OpenAI = require("openai");
const { z } = require("zod");
const fatsecret = require("../utils/fatsecretClient");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ---------- Schemas ----------
const IngredientSchema = z.object({
  name: z.string(),
  qty: z.number().optional(),
  unit: z.string().optional(),
  optional: z.boolean().optional(),
});
const RecipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  mealType: z.array(z.string()),
  diet: z.object({
    vegetarian: z.boolean().optional(),
    halal: z.boolean().optional(),
    pescatarian: z.boolean().optional()
  }).optional(),
  ingredients: z.array(IngredientSchema),
  stepsMd: z.string(),
  perServing: z.object({
    kcal: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    servings: z.number().default(1)
  })
});
const ResponseSchema = z.object({
  recommendations: z.array(RecipeSchema).max(10),
  rationale: z.string().optional()
});

// ---------- Fallback helpers ----------
function norm(s){ return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim(); }
function buildInvSet(inventory=[]) {
  const set = new Set();
  for (const it of inventory) set.add(norm(it.name));
  return set;
}
function coverageScore(recipe, invSet){
  if (!Array.isArray(recipe.ingredients)) return 0;
  let have = 0, need = 0;
  for (const ing of recipe.ingredients){
    if (ing.optional) continue;
    need++;
    if (invSet.has(norm(ing.name))) have++;
  }
  return need === 0 ? 0 : have/need;
}

// Minimal fallback bank (expand as needed)
const FALLBACK_BANK = [
  {
    id: "oats-protein-bowl",
    title: "Protein Oats Bowl",
    mealType: ["breakfast","snack"],
    diet: { vegetarian: true, halal: true, pescatarian: true },
    ingredients: [
      { name: "rolled oats", qty: 60, unit: "g" },
      { name: "whey protein", qty: 30, unit: "g" },
      { name: "milk", qty: 200, unit: "ml" },
      { name: "banana", qty: 1, unit: "pc", optional: true }
    ],
    stepsMd: [
      "Cook oats with milk until creamy (3–5 min).",
      "Off heat, whisk in protein powder.",
      "Top with sliced banana (optional)."
    ].join("\n"),
    perServing: { kcal: 520, protein: 35, carbs: 60, fat: 14, servings: 1 }
  },
  {
    id: "tuna-pasta",
    title: "15-Min Tuna Pasta",
    mealType: ["lunch","dinner"],
    diet: { halal: true, pescatarian: true, vegetarian: false },
    ingredients: [
      { name: "pasta", qty: 120, unit: "g" },
      { name: "canned tuna", qty: 120, unit: "g" },
      { name: "olive oil", qty: 1, unit: "tbsp" },
      { name: "lemon", qty: 0.5, unit: "pc", optional: true }
    ],
    stepsMd: [
      "Boil pasta until al dente.",
      "Drain; toss with tuna, oil, and lemon.",
      "Season to taste."
    ].join("\n"),
    perServing: { kcal: 630, protein: 38, carbs: 80, fat: 16, servings: 1 }
  },
  {
    id: "chicken-rice-bowl",
    title: "Garlic Chicken Rice Bowl",
    mealType: ["lunch","dinner"],
    diet: { halal: true, pescatarian: false, vegetarian: false },
    ingredients: [
      { name: "chicken breast", qty: 200, unit: "g" },
      { name: "rice", qty: 150, unit: "g" },
      { name: "garlic", qty: 2, unit: "cloves", optional: true },
      { name: "olive oil", qty: 1, unit: "tbsp" }
    ],
    stepsMd: [
      "Cook rice as usual.",
      "Pan-sear diced chicken in oil, add garlic to finish.",
      "Serve chicken over rice."
    ].join("\n"),
    perServing: { kcal: 700, protein: 55, carbs: 80, fat: 15, servings: 1 }
  }
];

// ---------- AI core ----------
async function aiRecommend(inventory, prefs, topK){
  const sys = [
    "You are a nutrition and meal-planning assistant for a fitness app.",
    "You MUST reply with only valid JSON matching the schema. No prose.",
    "Aim for high-protein, budget-friendly, quick recipes by default."
  ].join(" ");

  // gather fatsecret matches for inventory to give the model more concrete data
  let fatsecret_matches = {};
  try {
    // For each inventory item, do a light search and attach top 1-2 results (name and id)
    await Promise.all(
      (inventory || []).slice(0, 12).map(async (it) => {
        const q = (it && it.name) ? String(it.name) : null;
        if (!q) return;
        try {
          const resp = await fatsecret.searchFoods(q, 0);
          // normalize results to a small list
          const foods = (resp && resp.foods && resp.foods.food) || [];
          fatsecret_matches[q] = (Array.isArray(foods) ? foods : [foods])
            .slice(0, 3)
            .map(f => ({ id: f.food_id || f.food_id, name: f.food_name || f.food_name }));
        } catch (e) {
          // ignore individual search errors
          fatsecret_matches[q] = [];
        }
      })
    );
  } catch (e) {
    // non-fatal
    fatsecret_matches = {};
  }

  // Try to fetch nutrition details for top matches (limited to avoid rate limits)
  let fatsecret_nutrition = {};
  try {
    const items = Object.keys(fatsecret_matches).slice(0, 6);
    await Promise.all(
      items.map(async (q) => {
        const matches = fatsecret_matches[q] || [];
        fatsecret_nutrition[q] = [];
        for (let i = 0; i < Math.min(2, matches.length); i++) {
          const m = matches[i];
          if (!m || !m.id) continue;
          try {
            const detail = await fatsecret.getFood(m.id);
            // extract simple nutrition if available
            const food = detail && detail.food ? detail.food : detail;
            const n = (food && food.servings && food.servings.serving) || food;
            // The FatSecret response shapes vary; we'll try to pull common fields
            const nutrition = {
              id: m.id,
              name: m.name,
              calories: undefined,
              protein_g: undefined,
              carbs_g: undefined,
              fat_g: undefined,
              metric_serving_amount: undefined,
              metric_serving_unit: undefined,
              serving_description: undefined,
              serving_size: undefined,
            };
            try {
              // Some responses have .servings.serving as array or object
              const serving = Array.isArray(n) ? n[0] : n;
              if (serving && serving.calories) nutrition.calories = Number(serving.calories) || undefined;
              if (serving && serving.protein) nutrition.protein_g = Number(serving.protein) || undefined;
              if (serving && serving.carbohydrate) nutrition.carbs_g = Number(serving.carbohydrate) || undefined;
              if (serving && serving.fat) nutrition.fat_g = Number(serving.fat) || undefined;
              // FatSecret may provide metric serving fields
              if (serving && serving.metric_serving_amount) nutrition.metric_serving_amount = Number(serving.metric_serving_amount) || undefined;
              if (serving && serving.metric_serving_unit) nutrition.metric_serving_unit = serving.metric_serving_unit || undefined;
              if (serving && serving.serving_description) nutrition.serving_description = serving.serving_description || undefined;
              if (serving && serving.serving_size) nutrition.serving_size = serving.serving_size || undefined;
            } catch (e) {
              // ignore
            }
            fatsecret_nutrition[q].push(nutrition);
          } catch (e) {
            // ignore per-item errors
          }
        }
      })
    );
  } catch (e) {
    fatsecret_nutrition = {};
  }

  const usr = {
    task: "Generate meal ideas using what the user has available.",
    notes: "If an ingredient is missing, allow a close swap from pantry staples and call it out in the ingredient list.",
    constraints: {
      mustUseInventoryPrimarily: true,
      respectDietaryPrefs: true,
      maxCount: topK,
      outputUnits: "g/ml/pc",
      macroTargets: {
        kcalTarget: Number(prefs?.kcalTarget ?? prefs?.caloriesTarget ?? 0) || undefined,
        proteinTarget: Number(prefs?.proteinTarget ?? 0) || undefined
      }
    },
  inventory,
  fatsecret_matches, // extra structured data for the model to reference
  fatsecret_nutrition, // per-ingredient nutrition hints (if available)
  preferences: prefs || {},
    expectedJsonShape: {
      recommendations: [
        {
          id: "string-id",
          title: "string",
          mealType: ["breakfast|lunch|dinner|snack"],
          diet: { vegetarian: "bool", halal: "bool", pescatarian: "bool" },
          ingredients: [{ name: "string", qty: 0, unit: "g|ml|pc", optional: false }],
          stepsMd: "markdown steps",
          perServing: { kcal: 0, protein: 0, carbs: 0, fat: 0, servings: 1 }
        }
      ],
      rationale: "short string (optional)"
    }
  };
  // Build clearer instruction and example to ensure model returns a single JSON object matching schema
  // Provide a concrete example recipe to force the model to return consistent numeric quantities and macros.
  const exampleRecipe = {
    recommendations: [
      {
        id: "example-1",
        title: "Simple Chicken Rice Bowl",
        mealType: ["lunch"],
        diet: { vegetarian: false, halal: true, pescatarian: false },
        ingredients: [
          { name: "chicken breast", qty: 200, unit: "g", optional: false },
          { name: "rice", qty: 150, unit: "g", optional: false },
          { name: "olive oil", qty: 1, unit: "tbsp", optional: false },
          { name: "garlic", qty: 2, unit: "cloves", optional: true }
        ],
        stepsMd: "1. Cook 150 g rice (about 20 minutes simmer) until tender.\n2. Heat 1 tbsp olive oil in a pan, add 200 g diced chicken and cook 7–10 minutes until cooked through.\n3. Optionally add minced garlic in the last minute.\n4. Serve chicken over rice.",
        perServing: { kcal: 650, protein: 48, carbs: 72, fat: 15, servings: 1 }
      }
    ],
    rationale: "Example shows numeric gram quantities, cook times, and per-serving macros."
  };

  const userPayload = {
    instruction: "Using the provided inventory, fatsecret_matches, and fatsecret_nutrition, create up to maxCount distinct recipes that primarily use the supplied ingredients. For each recipe include explicit quantities (use provided inventory.qty when present, otherwise give grams), list optional ingredients, provide step-by-step instructions in markdown with cook times and temperatures when relevant, and estimate per-serving macros (kcal, protein, carbs, fat). If a perfect match isn't possible, recommend a single small pantry substitution and mark it as substitution in the ingredient list. Return only valid JSON matching the schema.",
    example: exampleRecipe,
    data: usr
  };

  // helper to call AI and capture raw for debugging
  const debug = { attempts: [], fatsecret_matches, fatsecret_nutrition };
  async function callAiOnce(payload, temperature = 0.2, extraSys) {
    const messages = [
      { role: "system", content: sys },
      { role: "user", content: JSON.stringify(payload) }
    ];
    if (extraSys) messages.push({ role: "system", content: extraSys });
    const completion = await openai.chat.completions.create({ model: DEFAULT_MODEL, temperature, messages });
    const raw = completion.choices?.[0]?.message?.content?.trim() || "{}";
    debug.attempts.push({ temperature, raw });
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e){
      debug.attempts[debug.attempts.length-1].parseError = true;
      throw new Error("AI_JSON_PARSE_ERROR");
    }
    return parsed;
  }

  // first attempt
  let parsed = await callAiOnce(userPayload, 0.2);
  let validated = ResponseSchema.parse(parsed);
  validated.recommendations = validated.recommendations.slice(0, topK);

  // if any recipe lacks numeric macros, do one retry with deterministic settings
  const needsRetry = validated.recommendations.some(r => {
    const p = r.perServing || {};
    return !(Number(p.kcal) || Number(p.protein) || Number(p.carbs) || Number(p.fat));
  });
  if (needsRetry) {
    try {
      const stricter = 'Return only JSON matching the schema. Ensure each recommendation includes numeric perServing.kcal, protein, carbs, fat and servings.';
      const parsed2 = await callAiOnce(userPayload, 0.0, stricter);
      const validated2 = ResponseSchema.parse(parsed2);
      validated2.recommendations = validated2.recommendations.slice(0, topK);
      // prefer validated2 if it looks better (has macros)
      const better = validated2.recommendations.some(r => {
        const p = r.perServing || {};
        return (Number(p.kcal) || Number(p.protein) || Number(p.carbs) || Number(p.fat));
      });
      if (better) validated = validated2;
    } catch (e) {
      // ignore retry failures; keep first validated
      debug.retryError = String(e && e.message ? e.message : e);
    }
  }
  // Post-process: estimate perServing macros when missing using fatsecret_nutrition (best-effort)
  function norm(s){ return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim(); }

  // Parse descriptions like "1 cup (227 g)" or "227 g" and return grams per described unit and unit name
  function parseServingDescription(desc){
    if (!desc) return null;
    const d = String(desc);
    const gramsMatch = d.match(/(\d+(?:[.,]\d+)?)\s*g\b/i);
    const unitMatch = d.match(/(\d+(?:[.,]\d+)?)\s*(cup|tbsp|tablespoon|tsp|teaspoon|slice|piece|pc|serving|ml|l|oz)\b/i);
    const qty = unitMatch ? Number(unitMatch[1].replace(',', '.')) : null;
    const unit = unitMatch ? unitMatch[2].toLowerCase() : null;
    const grams = gramsMatch ? Number(gramsMatch[1].replace(',', '.')) : null;
    return { grams, qty, unit };
  }

  function normalizeUnit(u){
    if (!u) return '';
    u = String(u).toLowerCase();
    if (u.endsWith('s')) u = u.slice(0,-1);
    if (u === 'g' || u === 'gram' || u === 'grams') return 'g';
    if (u === 'kg') return 'kg';
    if (['tbsp','tablespoon'].includes(u)) return 'tbsp';
    if (['tsp','teaspoon'].includes(u)) return 'tsp';
    if (['cup'].includes(u)) return 'cup';
    if (['pc','piece','slice'].includes(u)) return 'pc';
    if (['serving'].includes(u)) return 'serving';
    return u;
  }

  function gramsForIngredient(ing, found){
    try{
      const unit = (ing.unit||'').toLowerCase();
      const qty = Number(ing.qty) || 0;
      if (!qty) return null;
      // direct grams
      if (unit.includes('g')) return qty;
      // if fatsecret has metric serving in grams
      if (found.metric_serving_amount && found.metric_serving_unit && String(found.metric_serving_unit).toLowerCase().includes('g')){
        const fu = normalizeUnit(unit);
        const fserv = Number(found.metric_serving_amount) || null;
        if (fu === 'pc' || fu === 'serving' || fu === ''){
          return qty * fserv;
        }
        // if unit is cup/tbsp/tsp try to derive from serving_description
        const desc = found.serving_description || found.serving_size || '';
        const parsed = parseServingDescription(desc);
        if (parsed && parsed.grams && parsed.unit){
          const parsedUnit = normalizeUnit(parsed.unit);
          if (parsedUnit === fu){
            // parsed.qty units correspond to parsed.grams
            const perUnitGrams = parsed.grams / (parsed.qty || 1);
            return qty * perUnitGrams;
          }
        }
        // fallback: assume ingredient qty is number of servings
        return qty * fserv;
      }
      // try to parse grams from any serving description
      const desc = found.serving_description || found.serving_size || '';
      const parsed = parseServingDescription(desc);
      if (parsed && parsed.grams){
        // if parsed.unit matches ing.unit, use qty * (grams/qty_in_desc)
        const parsedUnit = normalizeUnit(parsed.unit);
        const ingUnit = normalizeUnit(unit);
        if (!parsedUnit || parsedUnit === ingUnit || ingUnit === ''){
          const perUnit = parsed.qty && parsed.qty > 0 ? parsed.grams/parsed.qty : parsed.grams;
          return qty * perUnit;
        }
      }
    }catch(e){ }
    return null;
  }

  const contributions = {};
  for (const rec of validated.recommendations){
    try {
      const per = rec.perServing = rec.perServing || { kcal: 0, protein: 0, carbs: 0, fat: 0, servings: 1 };
      let haveMacro = Number(per.kcal) || Number(per.protein) || Number(per.carbs) || Number(per.fat);
      contributions[rec.id || rec.title || Math.random().toString(36).slice(2)] = [];
      if (!haveMacro){
        // try to compute from ingredients
        let total = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
        for (const ing of rec.ingredients || []){
          const ingName = norm(ing.name || ing.item || "");
          const qty = Number(ing.qty) || 0;
          const unit = (ing.unit||"").toLowerCase();
          // find matching nutrition entry
          let found = null;
          for (const k of Object.keys(fatsecret_nutrition||{})){
            for (const nut of fatsecret_nutrition[k]||[]){
              if (norm(nut.name) === ingName){ found = nut; break; }
            }
            if (found) break;
          }
          if (!found) continue;
          // determine grams represented by the ingredient qty (use improved parser)
          let grams = gramsForIngredient(ing, found);
          let factor = 1;
          if (grams != null && found.metric_serving_amount) factor = grams / found.metric_serving_amount;
          else if (grams != null && !found.metric_serving_amount) factor = 1; // grams are absolute
          else factor = 1;
          const contrib = { name: found.name, grams: grams, kcal: 0, protein: 0, carbs: 0, fat: 0 };
          if (found.calories) { contrib.kcal = Math.round((Number(found.calories) || 0) * factor); total.kcal += contrib.kcal; }
          if (found.protein_g) { contrib.protein = Math.round((Number(found.protein_g) || 0) * factor); total.protein += contrib.protein; }
          if (found.carbs_g) { contrib.carbs = Math.round((Number(found.carbs_g) || 0) * factor); total.carbs += contrib.carbs; }
          if (found.fat_g) { contrib.fat = Math.round((Number(found.fat_g) || 0) * factor); total.fat += contrib.fat; }
          contributions[rec.id || rec.title || Math.random().toString(36).slice(2)].push(contrib);
        }
        // divide by servings if present
        const servings = (rec.perServing && rec.perServing.servings) ? Number(rec.perServing.servings) || 1 : 1;
        per.kcal = Math.round((total.kcal||0)/servings);
        per.protein = Math.round((total.protein||0));
        per.carbs = Math.round((total.carbs||0));
        per.fat = Math.round((total.fat||0));
        per.servings = servings;
      }
    } catch (e){
      // ignore post-process errors
    }
  }

  debug.contributions = contributions;
  return { ...validated, debug };
}

function fallbackRecommend(inventory, prefs, topK){
  const invSet = buildInvSet(inventory);
  const scored = FALLBACK_BANK
    .map(r => ({ r, score: coverageScore(r, invSet) }))
    .sort((a,b)=> b.score - a.score)
    .slice(0, topK)
    .map(x => x.r);
  return {
    recommendations: scored,
    rationale: "Fallback: ranked by how many required ingredients you already have."
  };
}

// ---------- Express handler ----------
exports.foodRecommendation = async (req, res) => {
  try {
    const { inventory = [], prefs = {}, topK = 5 } = req.body || {};
    if (!Array.isArray(inventory)) {
      return res.status(400).json({ error: "inventory must be an array" });
    }

    // Dev helper: allow forcing the fallback recommender via header (no AI call)
    try {
      const useFallbackHeader = String(req.headers['x-dev-use-fallback'] || req.query?.useFallback || '').toLowerCase();
      if (useFallbackHeader === '1' || useFallbackHeader === 'true'){
        const fb = fallbackRecommend(inventory, prefs, topK);
        // include fatsecret debug hints when requested
        if (process.env.NODE_ENV === 'development' || req.query?.debug === '1' || req.body?.debug) {
          return res.status(200).json({ ...fb, debug: { note: 'dev-forced-fallback' } });
        }
        return res.status(200).json(fb);
      }
    } catch (e) { /* ignore */ }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json(fallbackRecommend(inventory, prefs, topK));
    }

    try {
      const ai = await aiRecommend(inventory, prefs, Math.max(1, Math.min(10, Number(topK)||5)), { maxRetries: 2 });
      // ai may include a debug property. Only include debug in dev mode or when explicitly requested via ?debug=1 or body.debug=true
      const wantDebug = process.env.NODE_ENV === 'development' || req.query?.debug === '1' || req.body?.debug === true;
      if (!wantDebug && ai && ai.debug){
        const { debug, ...rest } = ai;
        return res.status(200).json(rest);
      }
      return res.status(200).json(ai);
    } catch (e) {
      const fb = fallbackRecommend(inventory, prefs, topK);
      return res.status(200).json({ ...fb, aiError: e.message || "AI_ERROR" });
    }
  } catch (err) {
    console.error("foodRecommendation error:", err);
    return res.status(500).json({ error: "Failed to generate food recommendations" });
  }
};
