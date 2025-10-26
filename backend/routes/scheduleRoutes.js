// backend/routes/scheduleRoutes.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const ScheduleController = require("../controllers/scheduleController");

const router = express.Router();

// All schedule endpoints require auth
router.use(authenticateToken);

// --- Schedule (single schedule per user) ---
router.get("/", ScheduleController.getSchedule);
router.post("/", ScheduleController.createSchedule);
router.put("/", ScheduleController.updateSchedule);

// --- Suggestions (auto compute workout/meal-prep windows) ---
router.post("/suggest", ScheduleController.suggestTimes);

// --- NEW: Auto-plan workouts into the calendar ---
router.post("/auto-plan", ScheduleController.autoPlanWorkouts);

// --- NEW: Generate an AI plan (if missing) and schedule each day weekly with exercises in notes ---
router.post("/ai/plan-and-schedule", ScheduleController.planAndScheduleAi);

// --- NEW: Schedule existing plans across the week and repeat every 7 days ---
router.post("/schedule-plans", ScheduleController.schedulePlansWeekly);

// --- Events under the user's schedule ---
router.get("/events", ScheduleController.listEvents);
router.post("/events", ScheduleController.createEvent);
router.get("/events/:id", ScheduleController.getEventById);
router.put("/events/:id", ScheduleController.updateEvent);
router.delete("/events/:id", ScheduleController.deleteEvent);

module.exports = router;
