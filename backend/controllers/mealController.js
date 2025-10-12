// backend/controllers/mealController.js
const Meal = require("../models/meal");
const MealPlan = require("../models/mealPlan");

const MealController = {
  // GET /api/meals?limit=&offset=
  async listMeals(req, res) {
    try {
      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);
      const meals = await Meal.listForUser(req.userId, { limit, offset });
      res.json({ success: true, meals, pagination: { limit, offset } });
    } catch (e) {
      console.error("listMeals error:", e);
      res.status(500).json({ error: "Failed to list meals" });
    }
  },

  // GET /api/meals/:id
  async getMealById(req, res) {
    try {
      const id = Number(req.params.id);
      const meal = await Meal.getById(id, req.userId);
      if (!meal) return res.status(404).json({ error: "Meal not found" });
      res.json({ success: true, meal });
    } catch (e) {
      console.error("getMealById error:", e);
      res.status(500).json({ error: "Failed to fetch meal" });
    }
  },

  // POST /api/meals
  async createMeal(req, res) {
    try {
      const created = await Meal.create(req.userId, {
        name: req.body.name ?? null,
        calories: req.body.calories ?? null,
        protein_g: req.body.protein_g ?? null,
        carbs_g: req.body.carbs_g ?? null,
        fat_g: req.body.fat_g ?? null,
        notes: req.body.notes ?? null,
        logged_at: req.body.logged_at ?? null, // ISO string or null -> let model default NOW()
      });
      res.status(201).json({ success: true, meal: created });
    } catch (e) {
      console.error("createMeal error:", e);
      res.status(500).json({ error: "Failed to create meal" });
    }
  },

  // PUT /api/meals/:id
  async updateMeal(req, res) {
    try {
      const id = Number(req.params.id);
      const updated = await Meal.update(id, req.userId, {
        name: req.body.name,
        calories: req.body.calories,
        protein_g: req.body.protein_g,
        carbs_g: req.body.carbs_g,
        fat_g: req.body.fat_g,
        notes: req.body.notes,
        logged_at: req.body.logged_at,
      });
      if (!updated) return res.status(404).json({ error: "Meal not found" });
      res.json({ success: true, meal: updated });
    } catch (e) {
      console.error("updateMeal error:", e);
      res.status(500).json({ error: "Failed to update meal" });
    }
  },

  // DELETE /api/meals/:id
  async deleteMeal(req, res) {
    try {
      const id = Number(req.params.id);
      const ok = await Meal.remove(id, req.userId);
      if (!ok) return res.status(404).json({ error: "Meal not found" });
      res.json({ success: true });
    } catch (e) {
      console.error("deleteMeal error:", e);
      res.status(500).json({ error: "Failed to delete meal" });
    }
  },

  // GET /api/meals/daily?date=YYYY-MM-DD
  async getDailyTotals(req, res) {
    try {
      const date = (req.query.date || "").toString().slice(0, 10); // YYYY-MM-DD
      const totals = await Meal.getDailyTotals(req.userId, date);
      res.json({ success: true, date, totals });
    } catch (e) {
      console.error("getDailyTotals error:", e);
      res.status(500).json({ error: "Failed to compute daily totals" });
    }
  },

  // GET /api/meals/plans/current
  async getCurrentMealPlan(req, res) {
    try {
      const plan = await MealPlan.getCurrentForUser(req.userId);
      res.json({ success: true, plan: plan || null });
    } catch (e) {
      console.error("getCurrentMealPlan error:", e);
      res.status(500).json({ error: "Failed to fetch current meal plan" });
    }
  },

  // POST /api/meals/plans
  async createMealPlan(req, res) {
    try {
      const { name, notes = null } = req.body || {};
      if (!name) return res.status(400).json({ error: "Name is required" });
      const plan = await MealPlan.createForUser(req.userId, { name, notes });
      res.status(201).json({ success: true, plan });
    } catch (e) {
      console.error("createMealPlan error:", e);
      res.status(500).json({ error: "Failed to create meal plan" });
    }
  },

  // POST /api/meals/plans/recommend
  async recommendMealPlan(req, res) {
    try {
      const plan = await MealPlan.recommendForUser(req.userId);
      res.status(201).json({ success: true, plan });
    } catch (e) {
      console.error("recommendMealPlan error:", e);
      res.status(500).json({ error: "Failed to recommend meal plan" });
    }
  },
};

module.exports = MealController;