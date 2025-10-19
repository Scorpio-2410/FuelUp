// backend/routes/fitnessActivityRoutes.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const FitnessActivityController = require("../controllers/fitnessActivityController");

// Apply authentication middleware to all routes
router.use(authenticateToken);

// POST /api/fitness/activities - Create a new fitness activity
router.post("/", FitnessActivityController.createActivity);

// GET /api/fitness/activities/:date - Get activities for a specific date
router.get("/:date", FitnessActivityController.getActivitiesByDate);

// GET /api/fitness/activities/range?start=YYYY-MM-DD&end=YYYY-MM-DD - Get activities for a date range
router.get("/range", FitnessActivityController.getActivitiesRange);

// GET /api/fitness/activities/stats?start=YYYY-MM-DD&end=YYYY-MM-DD - Get activity statistics
router.get("/stats", FitnessActivityController.getStats);

// GET /api/fitness/activities/calories/:date - Get total calories burned for a date
router.get("/calories/:date", FitnessActivityController.getCaloriesBurned);

// PUT /api/fitness/activities/:id - Update an activity
router.put("/:id", FitnessActivityController.updateActivity);

// DELETE /api/fitness/activities/:id - Delete an activity
router.delete("/:id", FitnessActivityController.deleteActivity);

// GET historical aggregated activities
router.get('/historical', FitnessActivityController.getHistoricalActivities);

module.exports = router;
