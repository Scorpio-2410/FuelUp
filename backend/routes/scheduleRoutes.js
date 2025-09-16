// backend/routes/scheduleRoutes.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const ScheduleController = require("../controllers/scheduleController");

const router = express.Router();

// All schedule endpoints require auth
router.use(authenticateToken);

/**
 * Order matters: put specific paths before "/:id"
 */

// --- Schedule (single schedule per user) ---
router.get("/", ScheduleController.getSchedule);
router.post("/", ScheduleController.createSchedule);
router.put("/", ScheduleController.updateSchedule);

// --- Suggestions (auto compute workout/meal-prep windows) ---
router.post("/suggest", ScheduleController.suggestTimes);

// --- Events under the user's schedule ---
router.get("/events", ScheduleController.listEvents);
router.post("/events", ScheduleController.createEvent);
router.get("/events/:id", ScheduleController.getEventById);
router.put("/events/:id", ScheduleController.updateEvent);
router.delete("/events/:id", ScheduleController.deleteEvent);

module.exports = router;
