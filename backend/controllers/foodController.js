// backend/controllers/foodController.js
const { pool } = require("../config/database");
const fatsecret = require("../utils/fatsecretClient");

/* ----- Foods (kept for future use) ----- */
exports.searchFoods = async (req, res) => {
  try {
    const { q = "", page = 0 } = req.query;
    const data = await fatsecret.searchFoods(q, Number(page));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
exports.getFood = async (req, res) => {
  try {
    const data = await fatsecret.getFood(req.params.id);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ----- Recipes (v3 search + v2 detail) ----- */
exports.searchRecipes = async (req, res) => {
  try {
    const {
      q = "",
      page = 0,
      max_results = 25,
      recipe_types,
      recipe_types_matchall,
    } = req.query;

    const data = await fatsecret.searchRecipesV3({
      search_expression: q,
      page_number: Number(page),
      max_results: Number(max_results),
      recipe_types,
      recipe_types_matchall:
        typeof recipe_types_matchall === "string"
          ? recipe_types_matchall === "true"
          : undefined,
    });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
exports.getRecipe = async (req, res) => {
  try {
    const data = await fatsecret.getRecipe(req.params.id);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/** Persist a FatSecret recipe into our DB for planning */
exports.saveRecipe = async (req, res) => {
  const client = await pool.connect();
  try {
    const { recipe_id, user_id = null } = req.body;
    if (!recipe_id)
      return res.status(400).json({ error: "recipe_id required" });

    const fs = await fatsecret.getRecipe(recipe_id);
    const r = fs.recipe;

    const steps = Array.isArray(r?.directions?.direction)
      ? r.directions.direction.map((d) => d.direction_description)
      : [];

    const ingredients = Array.isArray(r?.ingredients?.ingredient)
      ? r.ingredients.ingredient.map((it) => ({
          name: it.ingredient_description,
          qty: Number(it.number_of_units || 0),
          unit: it.measurement_description || null,
          food_id: it.food_id || null,
        }))
      : [];

    const nut = {
      calories: Number(r?.recipe_nutrition?.calories || 0),
      protein_g: Number(r?.recipe_nutrition?.protein || 0),
      carbs_g: Number(r?.recipe_nutrition?.carbohydrate || 0),
      fat_g: Number(r?.recipe_nutrition?.fat || 0),
      fiber_g: Number(r?.recipe_nutrition?.fiber || 0),
      sodium_mg: Number(r?.recipe_nutrition?.sodium || 0),
      sugar_g: Number(r?.recipe_nutrition?.sugar || 0),
    };

    const cookTime =
      Number(r?.preparation_time_min || 0) + Number(r?.cooking_time_min || 0);

    const { rows } = await client.query(
      `INSERT INTO recipes
        (user_id, source, external_id, name, description, cook_time_min, yield_servings, steps, image_url, nutrition_per_serv, ingredients)
       VALUES ($1,'fatsecret',$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [
        user_id,
        String(r.recipe_id),
        r.recipe_name,
        r.recipe_description || null,
        cookTime,
        Number(r.number_of_servings || 1),
        JSON.stringify(steps),
        r?.recipe_images?._1280 || r?.recipe_images?._500 || null,
        JSON.stringify(nut),
        JSON.stringify(ingredients),
      ]
    );

    const recipe =
      rows[0] ||
      (
        await client.query(
          `SELECT * FROM recipes WHERE source='fatsecret' AND external_id=$1`,
          [String(r.recipe_id)]
        )
      ).rows[0];

    res.json({ ok: true, recipe });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
};

/** Log a meal with nutrition tracking */
exports.logMeal = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const {
      name,
      meal_type,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      serving_size,
      serving_unit,
      notes,
      meal_plan_id,
      logged_at,
    } = req.body;

    if (!name) return res.status(400).json({ error: "Meal name required" });

    const { rows } = await client.query(
      `INSERT INTO meals
        (user_id, meal_plan_id, logged_at, name, meal_type, calories, protein_g, carbs_g, fat_g, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userId,
        meal_plan_id || null,
        logged_at || new Date(),
        name,
        meal_type || "other",
        calories || null,
        protein_g || null,
        carbs_g || null,
        fat_g || null,
        notes ? `${notes}${serving_size ? ` (${serving_size} ${serving_unit || ""})` : ""}` : serving_size ? `${serving_size} ${serving_unit || ""}` : null,
      ]
    );

    res.json({ ok: true, meal: rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
};

/** Get logged meals for a user */
exports.getUserMeals = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { limit = 50, offset = 0, start_date, end_date } = req.query;

    let query = `
      SELECT * FROM meals 
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramCount = 1;

    // Optional date filtering
    if (start_date) {
      paramCount++;
      query += ` AND logged_at >= $${paramCount}`;
      params.push(start_date);
    }
    if (end_date) {
      paramCount++;
      query += ` AND logged_at <= $${paramCount}`;
      params.push(end_date);
    }

    query += ` ORDER BY logged_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(Number(limit), Number(offset));

    const { rows } = await client.query(query, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM meals WHERE user_id = $1`;
    const { rows: countRows } = await client.query(countQuery, [userId]);
    const total = parseInt(countRows[0].count);

    res.json({ ok: true, meals: rows, total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
};
