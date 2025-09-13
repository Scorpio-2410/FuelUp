// controllers/scheduleController.js
const ScheduleEvent = require("../models/Schedule");

// Helpers
const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isTime = (s) =>
  s == null || (typeof s === "string" && /^\d{2}:\d{2}(:\d{2})?$/.test(s));

class ScheduleController {
  // Create new event
  static async createEvent(req, res) {
    try {
      const userId = req.userId;
      const {
        title,
        description,
        date, // YYYY-MM-DD
        startTime, // HH:MM or HH:MM:SS (nullable if all-day)
        endTime, // HH:MM or HH:MM:SS
        location,
        isAllDay,
        recurrenceRule,
      } = req.body;

      if (!title || !isDate(date)) {
        return res
          .status(400)
          .json({ error: "title and date (YYYY-MM-DD) are required" });
      }
      if (!isAllDay && (!isTime(startTime) || !isTime(endTime))) {
        return res
          .status(400)
          .json({ error: "startTime/endTime must be HH:MM (or HH:MM:SS)" });
      }

      const event = await ScheduleEvent.create({
        userId,
        title,
        description,
        date,
        startTime: isAllDay ? null : startTime || null,
        endTime: isAllDay ? null : endTime || null,
        location,
        isAllDay: !!isAllDay,
        recurrenceRule,
      });

      res.status(201).json({ message: "Event created", event: event.toJSON() });
    } catch (e) {
      console.error("createEvent error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get events for a single date
  static async getEventsByDate(req, res) {
    try {
      const userId = req.userId;
      const { date } = req.params;
      if (!isDate(date)) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      const events = await ScheduleEvent.findByUserAndDate(userId, date);
      res.json({ date, events: events.map((e) => e.toJSON()) });
    } catch (e) {
      console.error("getEventsByDate error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get events in a date range
  static async getEventsByRange(req, res) {
    try {
      const userId = req.userId;
      const { startDate, endDate } = req.query;

      if (!isDate(startDate) || !isDate(endDate)) {
        return res.status(400).json({
          error: "startDate and endDate are required in YYYY-MM-DD format",
        });
      }

      const events = await ScheduleEvent.findByUserAndRange(
        userId,
        startDate,
        endDate
      );
      res.json({
        startDate,
        endDate,
        events: events.map((e) => e.toJSON()),
      });
    } catch (e) {
      console.error("getEventsByRange error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Get single event
  static async getEvent(req, res) {
    try {
      const { id } = req.params;
      const event = await ScheduleEvent.findById(id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      if (event.userId !== req.userId)
        return res.status(403).json({ error: "Access denied" });
      res.json({ event: event.toJSON() });
    } catch (e) {
      console.error("getEvent error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Update event
  static async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const event = await ScheduleEvent.findById(id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      if (event.userId !== req.userId)
        return res.status(403).json({ error: "Access denied" });

      const patch = {};
      if ("title" in req.body) patch.title = req.body.title;
      if ("description" in req.body) patch.description = req.body.description;
      if ("date" in req.body) {
        if (!isDate(req.body.date))
          return res
            .status(400)
            .json({ error: "date must be YYYY-MM-DD format" });
        patch.date = req.body.date;
      }
      if ("startTime" in req.body) {
        if (!isTime(req.body.startTime))
          return res
            .status(400)
            .json({ error: "startTime must be HH:MM (or HH:MM:SS)" });
        patch.start_time = req.body.startTime;
      }
      if ("endTime" in req.body) {
        if (!isTime(req.body.endTime))
          return res
            .status(400)
            .json({ error: "endTime must be HH:MM (or HH:MM:SS)" });
        patch.end_time = req.body.endTime;
      }
      if ("location" in req.body) patch.location = req.body.location;
      if ("isAllDay" in req.body) patch.is_all_day = !!req.body.isAllDay;
      if ("recurrenceRule" in req.body)
        patch.recurrence_rule = req.body.recurrenceRule;

      const updated = await event.update(patch);
      res.json({ message: "Event updated", event: updated.toJSON() });
    } catch (e) {
      console.error("updateEvent error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Delete event
  static async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const event = await ScheduleEvent.findById(id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      if (event.userId !== req.userId)
        return res.status(403).json({ error: "Access denied" });

      await event.delete();
      res.json({ message: "Event deleted" });
    } catch (e) {
      console.error("deleteEvent error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = ScheduleController;
