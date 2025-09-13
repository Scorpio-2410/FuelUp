// routes/scheduleRoutes.js
const express = require("express");
const ScheduleController = require("../controllers/scheduleController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Create
router.post("/", authenticateToken, ScheduleController.createEvent);

// Collections
router.get(
  "/date/:date",
  authenticateToken,
  ScheduleController.getEventsByDate
);
router.get("/range", authenticateToken, ScheduleController.getEventsByRange);

// Single
router.get("/:id", authenticateToken, ScheduleController.getEvent);
router.put("/:id", authenticateToken, ScheduleController.updateEvent);
router.delete("/:id", authenticateToken, ScheduleController.deleteEvent);

module.exports = router;
