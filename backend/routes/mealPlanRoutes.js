const express = require("express");
const MealPlanController = require("../controllers/mealPlanController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Create a new meal plan
router.post("/", authenticateToken, MealPlanController.createPlan);

// List my meal plans (?status=&limit=&offset=)
router.get("/", authenticateToken, MealPlanController.listPlans);

// CRUD for a single plan
router.get("/:id", authenticateToken, MealPlanController.getPlan);
router.put("/:id", authenticateToken, MealPlanController.updatePlan);
router.delete("/:id", authenticateToken, MealPlanController.deletePlan);

module.exports = router;
