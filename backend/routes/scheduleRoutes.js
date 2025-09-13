const express = require("express");
const ScheduleController = require("../controllers/scheduleController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get my schedule (1:1 row)
router.get("/", authenticateToken, ScheduleController.getMySchedule);

// Ensure/update schedule metadata if you decide to store fields on schedules
router.put("/", authenticateToken, ScheduleController.upsertMySchedule);

// Events (children of my schedule)
router.post("/events", authenticateToken, ScheduleController.createEvent);

// List events with optional range filters (?from=YYYY-MM-DD&to=YYYY-MM-DD)
router.get("/events", authenticateToken, ScheduleController.listEvents);

router.get("/events/:id", authenticateToken, ScheduleController.getEvent);
router.put("/events/:id", authenticateToken, ScheduleController.updateEvent);
router.delete("/events/:id", authenticateToken, ScheduleController.deleteEvent);

module.exports = router;
