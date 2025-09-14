// backend/routes/mealRoutes.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const MealController = require("../controllers/mealController");

const router = express.Router();

// Everything here requires auth
router.use(authenticateToken);

/**
 * IMPORTANT: Order matters. Put the specific paths BEFORE "/:id"
 * to avoid "/plans" or "/daily" being captured by the id param.
 */

// ---- collections & aggregates ----
router.get("/daily", MealController.getDailyTotals);

// ---- meal plans ----
router.get("/plans/current", MealController.getCurrentMealPlan);
router.post("/plans/recommend", MealController.recommendMealPlan);
router.post("/plans", MealController.createMealPlan);

// ---- meals (CRUD) ----
router.get("/", MealController.listMeals);
router.post("/", MealController.createMeal);

router.get("/:id", MealController.getMealById);
router.put("/:id", MealController.updateMeal);
router.delete("/:id", MealController.deleteMeal);

module.exports = router;
