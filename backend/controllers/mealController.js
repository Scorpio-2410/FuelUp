const Meal = require("../models/Meal");
const MealPlan = require("../models/mealPlan");

class MealController {
  // Create a meal log (optionally link to a meal plan)
  static async createMeal(req, res) {
    try {
      const {
        mealPlanId,
        loggedAt,
        name,
        mealType,
        calories,
        proteinG,
        carbsG,
        fatG,
        notes,
      } = req.body;

      if (mealPlanId) {
        const plan = await MealPlan.findById(mealPlanId);
        if (!plan) return res.status(400).json({ error: "Invalid mealPlanId" });
        if (plan.userId !== req.userId)
          return res.status(403).json({ error: "Access denied" });
      }

      if (mealType && !Meal.validateType(mealType)) {
        return res.status(400).json({ error: "Invalid meal type" });
      }

      const meal = await Meal.create({
        userId: req.userId,
        mealPlanId: mealPlanId || null,
        loggedAt: loggedAt || null,
        name,
        mealType,
        calories,
        proteinG,
        carbsG,
        fatG,
        notes,
      });

      res.status(201).json({ success: true, meal });
    } catch (e) {
      console.error("createMeal error:", e);
      res.status(500).json({ error: "Failed to create meal" });
    }
  }

  // List meals for user (pagination)
  static async listMeals(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const meals = await Meal.findByUserId(req.userId, +limit, +offset);
      res.json({
        success: true,
        meals,
        pagination: { limit: +limit, offset: +offset },
      });
    } catch (e) {
      console.error("listMeals error:", e);
      res.status(500).json({ error: "Failed to list meals" });
    }
  }

  // Meals for a single date (YYYY-MM-DD)
  static async mealsByDate(req, res) {
    try {
      const { date } = req.params;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res
          .status(400)
          .json({ error: "Invalid date format (YYYY-MM-DD)" });
      }
      const meals = await Meal.findByUserAndDate(req.userId, date);
      res.json({ success: true, date, meals });
    } catch (e) {
      console.error("mealsByDate error:", e);
      res.status(500).json({ error: "Failed to fetch meals" });
    }
  }

  // Meals within date range (YYYY-MM-DD)
  static async mealsByRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      if (
        !startDate ||
        !endDate ||
        !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
      ) {
        return res.status(400).json({ error: "Invalid date range" });
      }
      const meals = await Meal.findByDateRange(req.userId, startDate, endDate);
      res.json({ success: true, startDate, endDate, meals });
    } catch (e) {
      console.error("mealsByRange error:", e);
      res.status(500).json({ error: "Failed to fetch meals" });
    }
  }

  // Meals grouped by type for a date
  static async mealsByTypeForDate(req, res) {
    try {
      const { date } = req.params;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res
          .status(400)
          .json({ error: "Invalid date format (YYYY-MM-DD)" });
      }
      const byType = await Meal.getMealsByTypeAndDate(req.userId, date);
      res.json({ success: true, date, mealsByType: byType });
    } catch (e) {
      console.error("mealsByTypeForDate error:", e);
      res.status(500).json({ error: "Failed to fetch meals by type" });
    }
  }

  // Daily nutrition totals
  static async dailyNutrition(req, res) {
    try {
      const { date } = req.params;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res
          .status(400)
          .json({ error: "Invalid date format (YYYY-MM-DD)" });
      }
      const totals = await Meal.getDailyNutritionSummary(req.userId, date);
      res.json({ success: true, date, totals });
    } catch (e) {
      console.error("dailyNutrition error:", e);
      res.status(500).json({ error: "Failed to fetch daily totals" });
    }
  }

  // Get one
  static async getMeal(req, res) {
    try {
      const { id } = req.params;
      const meal = await Meal.findById(id);
      if (!meal) return res.status(404).json({ error: "Meal not found" });
      if (meal.userId !== req.userId)
        return res.status(403).json({ error: "Access denied" });

      const macroPercentages = meal.getMacroPercentages();
      res.json({ success: true, meal, macroPercentages });
    } catch (e) {
      console.error("getMeal error:", e);
      res.status(500).json({ error: "Failed to fetch meal" });
    }
  }

  // Update
  static async updateMeal(req, res) {
    try {
      const { id } = req.params;
      const meal = await Meal.findById(id);
      if (!meal) return res.status(404).json({ error: "Meal not found" });
      if (meal.userId !== req.userId)
        return res.status(403).json({ error: "Access denied" });

      if (req.body.meal_type && !Meal.validateType(req.body.meal_type)) {
        return res.status(400).json({ error: "Invalid meal type" });
      }

      const updated = await meal.update(req.body);
      res.json({ success: true, meal: updated });
    } catch (e) {
      console.error("updateMeal error:", e);
      res.status(500).json({ error: "Failed to update meal" });
    }
  }

  // Delete
  static async deleteMeal(req, res) {
    try {
      const { id } = req.params;
      const meal = await Meal.findById(id);
      if (!meal) return res.status(404).json({ error: "Meal not found" });
      if (meal.userId !== req.userId)
        return res.status(403).json({ error: "Access denied" });

      await meal.delete();
      res.json({ success: true, message: "Meal deleted" });
    } catch (e) {
      console.error("deleteMeal error:", e);
      res.status(500).json({ error: "Failed to delete meal" });
    }
  }
}

module.exports = MealController;
