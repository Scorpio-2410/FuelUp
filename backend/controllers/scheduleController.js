const Schedule = require("../models/schedule");
const Event = require("../models/event");

class ScheduleController {
  // Get (or create) the user's schedule
  static async getSchedule(req, res) {
    try {
      const schedule = await Schedule.getOrCreate(req.userId);
      res.json({ success: true, schedule });
    } catch (e) {
      console.error("getSchedule error:", e);
      res.status(500).json({ error: "Failed to retrieve schedule" });
    }
  }

  // Update schedule timezone/preferences
  static async updateSchedule(req, res) {
    try {
      const schedule = await Schedule.getOrCreate(req.userId);
      const patch = {};

      if ("timezone" in req.body) patch.timezone = req.body.timezone || null;
      if ("preferences" in req.body)
        patch.preferences = req.body.preferences || null;

      const updated = await schedule.update(patch);
      res.json({ success: true, schedule: updated });
    } catch (e) {
      console.error("updateSchedule error:", e);
      res.status(500).json({ error: "Failed to update schedule" });
    }
  }

  // List events for the user's schedule (optional from/to, pagination)
  static async listEvents(req, res) {
    try {
      const schedule = await Schedule.getOrCreate(req.userId);
      const { from, to, limit = 100, offset = 0 } = req.query;
      const events = await Event.listForSchedule(schedule.id, {
        from,
        to,
        limit,
        offset,
      });
      res.json({
        success: true,
        events,
        pagination: { limit: +limit, offset: +offset },
      });
    } catch (e) {
      console.error("listEvents error:", e);
      res.status(500).json({ error: "Failed to list events" });
    }
  }

  // Create a new event for the user's schedule
  static async createEvent(req, res) {
    try {
      const schedule = await Schedule.getOrCreate(req.userId);
      const { category, title, startAt, endAt, location, notes } = req.body;

      if (!category || !title || !startAt) {
        return res
          .status(400)
          .json({ error: "category, title and startAt are required" });
      }
      if (!Event.validateCategory(category)) {
        return res
          .status(400)
          .json({ error: "Invalid category (meal|workout|other)" });
      }

      const event = await Event.create({
        scheduleId: schedule.id,
        category,
        title,
        startAt,
        endAt: endAt || null,
        location: location || null,
        notes: notes || null,
      });

      res.status(201).json({ success: true, event });
    } catch (e) {
      console.error("createEvent error:", e);
      res.status(500).json({ error: "Failed to create event" });
    }
  }

  // Update an event (ensure it belongs to the user's schedule)
  static async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const event = await Event.findById(id);
      if (!event) return res.status(404).json({ error: "Event not found" });

      // ownership check via schedule
      const schedule = await Schedule.findByUserId(req.userId);
      if (!schedule || schedule.id !== event.scheduleId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const patch = {};
      const allowed = [
        "category",
        "title",
        "start_at",
        "end_at",
        "location",
        "notes",
      ];
      for (const k of allowed) {
        if (k in req.body) patch[k] = req.body[k];
      }
      if (patch.category && !Event.validateCategory(patch.category)) {
        return res
          .status(400)
          .json({ error: "Invalid category (meal|workout|other)" });
      }

      const updated = await event.update(patch);
      res.json({ success: true, event: updated });
    } catch (e) {
      console.error("updateEvent error:", e);
      res.status(500).json({ error: "Failed to update event" });
    }
  }

  // Delete an event (ensure it belongs to the user's schedule)
  static async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const event = await Event.findById(id);
      if (!event) return res.status(404).json({ error: "Event not found" });

      const schedule = await Schedule.findByUserId(req.userId);
      if (!schedule || schedule.id !== event.scheduleId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await event.delete();
      res.json({ success: true, message: "Event deleted" });
    } catch (e) {
      console.error("deleteEvent error:", e);
      res.status(500).json({ error: "Failed to delete event" });
    }
  }
}

module.exports = ScheduleController;
