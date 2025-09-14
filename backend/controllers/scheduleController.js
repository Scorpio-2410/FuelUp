// backend/controllers/scheduleController.js
const Schedule = require("../models/schedule");
const Event = require("../models/event");

const ensureSchedule = async (userId) => {
  // Get or create the user's single schedule
  let schedule = await Schedule.getForUser?.(userId);
  if (!schedule && Schedule.createForUser) {
    schedule = await Schedule.createForUser(userId, {
      title: null,
      timezone: null,
    });
  }
  return schedule;
};

const ScheduleController = {
  // GET /api/schedule
  async getSchedule(req, res) {
    try {
      const schedule = await Schedule.getForUser?.(req.userId);
      res.json({ success: true, schedule: schedule || null });
    } catch (e) {
      console.error("getSchedule error:", e);
      res.status(500).json({ error: "Failed to fetch schedule" });
    }
  },

  // POST /api/schedule
  async createSchedule(req, res) {
    try {
      const existing = await Schedule.getForUser?.(req.userId);
      if (existing) return res.json({ success: true, schedule: existing });

      const { title = null, timezone = null } = req.body || {};
      const created = await Schedule.createForUser?.(req.userId, {
        title,
        timezone,
      });
      res.status(201).json({ success: true, schedule: created });
    } catch (e) {
      console.error("createSchedule error:", e);
      res.status(500).json({ error: "Failed to create schedule" });
    }
  },

  // PUT /api/schedule
  async updateSchedule(req, res) {
    try {
      const { title = null, timezone = null } = req.body || {};
      const updated = await Schedule.updateForUser?.(req.userId, {
        title,
        timezone,
      });
      if (!updated)
        return res.status(404).json({ error: "Schedule not found" });
      res.json({ success: true, schedule: updated });
    } catch (e) {
      console.error("updateSchedule error:", e);
      res.status(500).json({ error: "Failed to update schedule" });
    }
  },

  // GET /api/schedule/events
  async listEvents(req, res) {
    try {
      const evts = await Event.listForUser?.(req.userId);
      res.json({ success: true, events: evts || [] });
    } catch (e) {
      console.error("listEvents error:", e);
      res.status(500).json({ error: "Failed to list events" });
    }
  },

  // POST /api/schedule/events
  async createEvent(req, res) {
    try {
      const schedule = await ensureSchedule(req.userId);
      if (!schedule)
        return res.status(500).json({ error: "Could not resolve schedule" });

      const payload = {
        schedule_id: schedule.id,
        user_id: req.userId,
        category: req.body.category, // "meal" | "workout" | "other"
        title: req.body.title,
        start_at: req.body.start_at, // ISO string
        end_at: req.body.end_at ?? null, // ISO or null
        location: req.body.location ?? null,
        notes: req.body.notes ?? null,
      };

      const created = await Event.create?.(payload);
      res.status(201).json({ success: true, event: created });
    } catch (e) {
      console.error("createEvent error:", e);
      res.status(500).json({ error: "Failed to create event" });
    }
  },

  // GET /api/schedule/events/:id
  async getEventById(req, res) {
    try {
      const id = Number(req.params.id);
      const evt = await Event.getById?.(id, req.userId);
      if (!evt) return res.status(404).json({ error: "Event not found" });
      res.json({ success: true, event: evt });
    } catch (e) {
      console.error("getEventById error:", e);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  },

  // PUT /api/schedule/events/:id
  async updateEvent(req, res) {
    try {
      const id = Number(req.params.id);
      const updated = await Event.update?.(id, req.userId, {
        category: req.body.category,
        title: req.body.title,
        start_at: req.body.start_at,
        end_at: req.body.end_at,
        location: req.body.location,
        notes: req.body.notes,
      });
      if (!updated) return res.status(404).json({ error: "Event not found" });
      res.json({ success: true, event: updated });
    } catch (e) {
      console.error("updateEvent error:", e);
      res.status(500).json({ error: "Failed to update event" });
    }
  },

  // DELETE /api/schedule/events/:id
  async deleteEvent(req, res) {
    try {
      const id = Number(req.params.id);
      const ok = await Event.remove?.(id, req.userId);
      if (!ok) return res.status(404).json({ error: "Event not found" });
      res.json({ success: true });
    } catch (e) {
      console.error("deleteEvent error:", e);
      res.status(500).json({ error: "Failed to delete event" });
    }
  },
};

module.exports = ScheduleController;
