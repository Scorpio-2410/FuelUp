// backend/controllers/mealPlanController.js
const { pool } = require("../config/database");

/** List meal plans for a user (optional ?status=) */
exports.listMealPlans = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = Number(req.query.user_id);
    const status = (req.query.status || "").toString().trim();
    if (!user_id) return res.status(400).json({ error: "user_id required" });

    const params = [user_id];
    let sql = `SELECT id, user_id, name, status, start_date, end_date, target_calories, notes, created_at, updated_at
               FROM meal_plans
               WHERE user_id=$1`;
    if (status) {
      sql += ` AND status=$2`;
      params.push(status);
    }
    sql += ` ORDER BY created_at DESC LIMIT 50`;
    const { rows } = await client.query(sql, params);
    res.json({ plans: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
};

/** Create a meal plan (max 5 via trigger) */
exports.createMealPlan = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      user_id,
      name,
      start_date = null,
      end_date = null,
      notes = null,
    } = req.body;
    if (!user_id || !name)
      return res.status(400).json({ error: "user_id and name required" });

    const { rows } = await client.query(
      `INSERT INTO meal_plans (user_id, name, start_date, end_date, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [user_id, name, start_date, end_date, notes]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
};

/** Add a recipe occurrence ("meal") into a plan */
exports.addMealToPlan = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      user_id,
      meal_plan_id,
      recipe_id,
      servings = 1,
      meal_type = "other",
      scheduled_at = null,
      notes = null,
    } = req.body;

    if (!user_id || !meal_plan_id || !recipe_id)
      return res
        .status(400)
        .json({ error: "user_id, meal_plan_id, recipe_id required" });

    const plan = (
      await client.query(
        `SELECT * FROM meal_plans WHERE id=$1 AND user_id=$2`,
        [meal_plan_id, user_id]
      )
    ).rows[0];
    if (!plan)
      return res.status(404).json({ error: "Meal plan not found for user" });

    const rec = (
      await client.query(`SELECT id FROM recipes WHERE id=$1`, [recipe_id])
    ).rows[0];
    if (!rec) return res.status(404).json({ error: "Recipe not found" });

    const { rows } = await client.query(
      `INSERT INTO meal_plan_recipes (meal_plan_id, recipe_id, meal_type, servings, scheduled_at, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [meal_plan_id, recipe_id, meal_type, servings, scheduled_at, notes]
    );

    const summary = await computePlanSummary(client, meal_plan_id);
    res.json({ added: rows[0], summary });
  } catch (e) {
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
};

/** Read a plan summary: items + totals + aggregated ingredients */
exports.getPlanSummary = async (req, res) => {
  const client = await pool.connect();
  try {
    const planId = Number(req.params.planId);
    const summary = await computePlanSummary(client, planId);
    res.json(summary);
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
};

/** Helper: compute totals and merged ingredients */
async function computePlanSummary(client, meal_plan_id) {
  const items = (
    await client.query(
      `SELECT mpr.*, r.name, r.cook_time_min, r.nutrition_per_serv, r.ingredients
         FROM meal_plan_recipes mpr
         JOIN recipes r ON r.id = mpr.recipe_id
        WHERE mpr.meal_plan_id=$1
        ORDER BY COALESCE(mpr.scheduled_at, mpr.created_at) ASC`,
      [meal_plan_id]
    )
  ).rows;

  const totals = items.reduce(
    (acc, it) => {
      const s = Number(it.servings || 1);
      const n = it.nutrition_per_serv || {};
      acc.cook_time_min += Number(it.cook_time_min || 0) * s;
      acc.calories += Number(n.calories || 0) * s;
      acc.protein_g += Number(n.protein_g || 0) * s;
      acc.carbs_g += Number(n.carbs_g || 0) * s;
      acc.fat_g += Number(n.fat_g || 0) * s;
      acc.fiber_g += Number(n.fiber_g || 0) * s;
      acc.sugar_g += Number(n.sugar_g || 0) * s;
      acc.sodium_mg += Number(n.sodium_mg || 0) * s;
      return acc;
    },
    {
      cook_time_min: 0,
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 0,
    }
  );

  const ingMap = new Map();
  for (const it of items) {
    const s = Number(it.servings || 1);
    const arr = Array.isArray(it.ingredients) ? it.ingredients : [];
    for (const g of arr) {
      const key = `${(g.name || "").toLowerCase()}|${g.unit || ""}`;
      const prev = ingMap.get(key) || {
        name: g.name,
        unit: g.unit || null,
        qty: 0,
        food_id: g.food_id || null,
      };
      prev.qty += Number(g.qty || 0) * s;
      ingMap.set(key, prev);
    }
  }

  return {
    plan_id: Number(meal_plan_id),
    items: items.map((i) => ({
      id: i.id,
      recipe_id: i.recipe_id,
      name: i.name,
      meal_type: i.meal_type,
      servings: i.servings,
      scheduled_at: i.scheduled_at,
      cook_time_min: i.cook_time_min,
      nutrition_per_serv: i.nutrition_per_serv,
    })),
    totals,
    ingredients_list: Array.from(ingMap.values()),
  };
}

exports.deleteMealPlan = async (req, res) => {
  const client = await pool.connect();
  try {
    const planId = Number(req.params.planId);
    const { user_id } = req.query; // optional, if you pass user_id in request

    if (!planId) return res.status(400).json({ error: "planId required" });

    const { rowCount } = await client.query(
      `DELETE FROM meal_plans WHERE id=$1`,
      [planId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    res.json({ success: true, message: "Meal plan deleted successfully." });
  } catch (error) {
    console.error("Delete plan error:", error);
    res.status(500).json({ error: "Server error while deleting meal plan." });
  } finally {
    client.release();
  }
};


module.exports = {
  listMealPlans: exports.listMealPlans,
  createMealPlan: exports.createMealPlan,
  addMealToPlan: exports.addMealToPlan,
  getPlanSummary: exports.getPlanSummary,
  deleteMealPlan: exports.deleteMealPlan, 
};
