const express = require("express");
const FitnessPlanController = require("../controllers/fitnessPlanController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Create a new plan
router.post("/", authenticateToken, FitnessPlanController.createPlan);

// List my plans (optional ?status=draft|active|archived&limit=&offset=)
router.get("/", authenticateToken, FitnessPlanController.listPlans);

// Plan CRUD
router.get("/:id", authenticateToken, FitnessPlanController.getPlan);
router.put("/:id", authenticateToken, FitnessPlanController.updatePlan);
router.delete("/:id", authenticateToken, FitnessPlanController.deletePlan);

module.exports = router;
