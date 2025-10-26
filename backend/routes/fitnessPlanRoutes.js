const express = require("express");
const FitnessPlanController = require("../controllers/fitnessPlanController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
router.use(authenticateToken);

// Create + list
router.post("/", FitnessPlanController.createPlan);
router.get("/", FitnessPlanController.listPlans);

// CRUD one
router.get("/:id", FitnessPlanController.getPlan);
router.put("/:id", FitnessPlanController.updatePlan);
router.delete("/:id", FitnessPlanController.deletePlan);

module.exports = router;
