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

// --- Events under the user's schedule ---
router.get("/events", ScheduleController.listEvents);
router.post("/events", ScheduleController.createEvent);
router.get("/events/:id", ScheduleController.getEventById);
router.put("/events/:id", ScheduleController.updateEvent);
router.delete("/events/:id", ScheduleController.deleteEvent);

// --- Suggestions (smart time slots) ---
router.post("/suggest", ScheduleController.suggestTimes);

module.exports = router;
