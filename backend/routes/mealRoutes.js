const express = require("express");
const MealController = require("../controllers/mealController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Create
router.post("/", authenticateToken, MealController.createMeal);

// Collections
router.get("/", authenticateToken, MealController.getUserMeals);

// Date-based queries
router.get("/date/:date", authenticateToken, MealController.getMealsByDate);
router.get("/range", authenticateToken, MealController.getMealsByDateRange);

// Daily nutrition summary
router.get(
  "/date/:date/summary",
  authenticateToken,
  MealController.getDailyNutrition
);

// Grouped by type for a date (if you expose mealType client-side)
router.get(
  "/date/:date/by-type",
  authenticateToken,
  MealController.getMealsByTypeAndDate
);

// Single meal CRUD
router.get("/:id", authenticateToken, MealController.getMeal);
router.put("/:id", authenticateToken, MealController.updateMeal);
router.delete("/:id", authenticateToken, MealController.deleteMeal);

module.exports = router;
