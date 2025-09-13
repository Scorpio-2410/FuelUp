// This controller keeps your existing route shape but stores data in nutrition_meals
const { pool } = require("../config/database");
const NutritionMeal = require("../models/Nutrition");
const { toPlainDate } = require("../utils/dates");

const ALLOWED_MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "custom"];

function normalizeMacros({ calories, protein, carbohydrates, fat }) {
  const cals = calories != null ? Number(calories) : 0;
  const p = protein != null ? Number(protein) : 0;
  const carbs = carbohydrates != null ? Number(carbohydrates) : 0;
  const f = fat != null ? Number(fat) : 0;
  return { cals, p, carbs, f };
}

class MealController {
  // Create a new meal entry
  static async createMeal(req, res) {
    try {
      const {
        mealName,
        mealType,
        calories,
        protein,
        carbohydrates,
        fat,
        mealDate,
        notes,
        items, // optional array [{name, calories, proteinG, carbsG, fatG, quantity}]
      } = req.body || {};

      const date = toPlainDate(mealDate);
      if (!mealName || !mealType || !date) {
        return res
          .status(400)
          .json({ error: "Meal name, type, and date are required" });
      }
      if (!ALLOWED_MEAL_TYPES.includes(mealType)) {
        return res
          .status(400)
          .json({
            error:
              "Invalid meal type. Must be breakfast, lunch, dinner, snack, or custom",
          });
      }

      let itemsArr = Array.isArray(items) ? items : null;

      // If no items provided, build a single-line item from macros
      if (!itemsArr) {
        const { cals, p, carbs, f } = normalizeMacros({
          calories,
          protein,
          carbohydrates,
          fat,
        });
        itemsArr = [
          {
            name: mealName,
            quantity: 1,
            calories: cals,
            proteinG: p,
            carbsG: carbs,
            fatG: f,
            notes: notes || null,
          },
        ];
      }

      const meal = await NutritionMeal.create(req.userId, {
        mealType,
        mealDate: date,
        title: mealName,
        items: itemsArr,
      });

      return res.status(201).json({
        message: "Meal logged successfully",
        meal: meal.toJSON(),
      });
    } catch (error) {
      console.error("Create meal error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error while creating meal" });
    }
  }

  // Get meals for a user (with pagination, newest first)
  static async getUserMeals(req, res) {
    try {
      const limit = Math.max(
        1,
        Math.min(100, parseInt(req.query.limit || "20", 10))
      );
      const offset = Math.max(0, parseInt(req.query.offset || "0", 10));

      const r = await pool.query(
        `SELECT * FROM nutrition_meals
         WHERE user_id=$1
         ORDER BY meal_date DESC, id DESC
         LIMIT $2 OFFSET $3`,
        [req.userId, limit, offset]
      );

      const meals = r.rows.map((row) => new NutritionMeal(row).toJSON());

      return res.json({
        meals,
        pagination: {
          limit,
          offset,
          hasMore: meals.length === limit,
        },
      });
    } catch (error) {
      console.error("Get user meals error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error while fetching meals" });
    }
  }

  // Get meals for a specific date
  static async getMealsByDate(req, res) {
    try {
      const date = toPlainDate(req.params.date);
      if (!date) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }
      const meals = await NutritionMeal.listByDate(req.userId, date);
      return res.json({ date, meals: meals.map((m) => m.toJSON()) });
    } catch (error) {
      console.error("Get meals by date error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error while fetching meals" });
    }
  }

  // Get meals within a date range (returns per-day aggregates for the range)
  static async getMealsByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const s = toPlainDate(startDate);
      const e = toPlainDate(endDate);
      if (!s || !e) {
        return res
          .status(400)
          .json({
            error: "Start date and end date are required as YYYY-MM-DD",
          });
      }
      const days = await NutritionMeal.rangeSummary(req.userId, s, e);
      return res.json({ startDate: s, endDate: e, days });
    } catch (error) {
      console.error("Get meals by date range error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error while fetching meals" });
    }
  }

  // Update a meal
  static async updateMeal(req, res) {
    try {
      const id = req.params.id;

      // Accept either new items array, or macros to transform into a single item
      const {
        mealName,
        mealType,
        calories,
        protein,
        carbohydrates,
        fat,
        mealDate,
        notes,
        items,
      } = req.body || {};

      let patch = {};
      if (mealType) {
        if (!ALLOWED_MEAL_TYPES.includes(mealType)) {
          return res
            .status(400)
            .json({
              error:
                "Invalid meal type. Must be breakfast, lunch, dinner, snack, or custom",
            });
        }
        patch.mealType = mealType;
      }
      if (mealDate) patch.mealDate = toPlainDate(mealDate);
      if (mealName) patch.title = mealName;

      if (Array.isArray(items)) {
        patch.items = items;
      } else if (
        calories != null ||
        protein != null ||
        carbohydrates != null ||
        fat != null
      ) {
        const { cals, p, carbs, f } = normalizeMacros({
          calories,
          protein,
          carbohydrates,
          fat,
        });
        patch.items = [
          {
            name: mealName || "Updated meal",
            quantity: 1,
            calories: cals,
            proteinG: p,
            carbsG: carbs,
            fatG: f,
            notes: notes || null,
          },
        ];
      }

      const meal = await NutritionMeal.update(req.userId, id, patch);
      return res.json({
        message: "Meal updated successfully",
        meal: meal.toJSON(),
      });
    } catch (error) {
      console.error("Update meal error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error while updating meal" });
    }
  }

  // Delete a meal
  static async deleteMeal(req, res) {
    try {
      const id = req.params.id;
      const ok = await NutritionMeal.delete(req.userId, id);
      if (!ok) return res.status(404).json({ error: "Meal not found" });
      return res.json({ message: "Meal deleted successfully" });
    } catch (error) {
      console.error("Delete meal error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error while deleting meal" });
    }
  }

  // Get daily nutrition summary
  static async getDailyNutrition(req, res) {
    try {
      const date = toPlainDate(req.params.date);
      if (!date) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }
      const summary = await NutritionMeal.dailySummary(req.userId, date);
      return res.json({ date, nutrition: summary });
    } catch (error) {
      console.error("Get daily nutrition error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error while fetching nutrition data" });
    }
  }

  // Get meals grouped by type for a specific date
  static async getMealsByTypeAndDate(req, res) {
    try {
      const date = toPlainDate(req.params.date);
      if (!date) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }
      const meals = await NutritionMeal.listByDate(req.userId, date);
      const byType = meals.reduce((acc, m) => {
        const t = m.mealType || "custom";
        if (!acc[t]) acc[t] = [];
        acc[t].push(m.toJSON());
        return acc;
      }, {});
      return res.json({ date, mealsByType: byType });
    } catch (error) {
      console.error("Get meals by type error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error while fetching meals by type" });
    }
  }

  // Get single meal details
  static async getMeal(req, res) {
    try {
      const id = req.params.id;
      const meal = await NutritionMeal.findByIdForUser(req.userId, id);
      if (!meal) return res.status(404).json({ error: "Meal not found" });
      return res.json({ meal: meal.toJSON() });
    } catch (error) {
      console.error("Get meal error:", error);
      return res
        .status(500)
        .json({ error: "Internal server error while fetching meal" });
    }
  }
}

module.exports = MealController;
