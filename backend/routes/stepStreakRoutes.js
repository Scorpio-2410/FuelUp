// backend/routes/stepStreakRoutes.js
const express = require("express");
const StepStreakController = require("../controllers/stepStreakController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// All step tracking endpoints require auth (applied once for all routes)
router.use(authenticateToken);

// Create or update step record
router.post("/", StepStreakController.upsertSteps);

// Get step records by date range
router.get("/range", StepStreakController.getStepsRange);

// Get statistics
router.get("/stats", StepStreakController.getStats);

// Get weekly stats
router.get("/weekly", StepStreakController.getWeeklyStats);

// Get monthly stats
router.get("/monthly", StepStreakController.getMonthlyStats);

// Get current streak
router.get("/streak", StepStreakController.getStreak);

// Get chart data
router.get("/chart", StepStreakController.getChartData);

// Get steps for specific date
router.get("/:date", StepStreakController.getStepsByDate);

// Delete step record for specific date
router.delete("/:date", StepStreakController.deleteSteps);

module.exports = router;

