// backend/routes/mealPlanRoutes.js
const express = require("express");
const ctrl = require("../controllers/mealPlanController");
const router = express.Router();

router.get("/plans", ctrl.listMealPlans);
router.post("/plans", ctrl.createMealPlan);
router.post("/plans/add", ctrl.addMealToPlan);
router.get("/plans/:planId/summary", ctrl.getPlanSummary);

module.exports = router;
