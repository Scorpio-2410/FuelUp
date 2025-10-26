// backend/routes/workoutSessionRoutes.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const WorkoutSessionController = require("../controllers/workoutSessionController");

const router = express.Router();

// All workout session endpoints require auth
router.use(authenticateToken);

// Create a new workout session
router.post("/", WorkoutSessionController.createSession);

// Get all sessions for the current user
router.get("/", WorkoutSessionController.listSessions);

// Get user's streak and total workouts
router.get("/streak", WorkoutSessionController.getStreak);

// Get sessions by date range
router.get("/range", WorkoutSessionController.getSessionsByDateRange);

// Get a specific session
router.get("/:id", WorkoutSessionController.getSession);

// Update a session
router.put("/:id", WorkoutSessionController.updateSession);

// Delete a session
router.delete("/:id", WorkoutSessionController.deleteSession);

module.exports = router;
