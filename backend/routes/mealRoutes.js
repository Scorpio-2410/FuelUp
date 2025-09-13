// routes/mealRoutes.js
const express = require("express");
const MealController = require("../controllers/mealController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Protect everything under /api/meals
router.use(authenticateToken);

// Create
router.post("/", MealController.createMeal);

// Collections
router.get("/", MealController.getUserMeals);
router.get("/date/:date", MealController.getMealsByDate);
router.get("/date/:date/summary", MealController.getDailyNutrition);
router.get("/date/:date/by-type", MealController.getMealsByTypeAndDate);

// Single
router.get("/:id", MealController.getMeal);
router.put("/:id", MealController.updateMeal);
router.delete("/:id", MealController.deleteMeal);

module.exports = router;
