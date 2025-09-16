// backend/controllers/scheduleController.js
const Schedule = require("../models/schedule");
const Event = require("../models/event");
const { pool } = require("../config/database");

const ensureSchedule = async (userId) => Schedule.getOrCreate(userId);

// Recover the real DB id if a synthetic occurrence id was passed.
const coerceDbId = (raw) => {
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  // If an occurrence id was built as `${dbId}${last6OfStart}`, peel the suffix.
  // Adjust threshold as needed for your DB id range.
  if (n > 9_000_000_000) {
    return Math.floor(n / 1_000_000);
  }
  return n;
};

const assertOwnsEvent = async (userId, eventIdRaw) => {
  const eventId = coerceDbId(eventIdRaw);
  if (eventId == null) return null;
  const evt = await Event.findById(eventId);
  if (!evt) return null;
  const sch = await Schedule.findByUserId(userId);
  if (!sch || sch.id !== evt.scheduleId) return null;
  return { evt, sch };
};

/* ---------- simple helper for suggestions ---------- */
function computeFreeSlots(events, dayStart = 6, dayEnd = 22) {
  const byDay = new Map();
  for (const e of events) {
    const s = new Date(e.startAt || e.start_at);
    const eEnd =
      e.endAt || e.end_at
        ? new Date(e.endAt || e.end_at)
        : new Date(s.getTime() + 30 * 60000);
    const day = s.toISOString().slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push({ start: s, end: eEnd });
  }
  for (const arr of byDay.values()) arr.sort((a, b) => a.start - b.start);

  const freeByDay = new Map();
  for (const [day, arr] of byDay.entries()) {
    const start = new Date(
      `${day}T${String(dayStart).padStart(2, "0")}:00:00.000Z`
    );
    const end = new Date(
      `${day}T${String(dayEnd).padStart(2, "0")}:00:00.000Z`
    );
    let cur = start;
    const free = [];
    for (const { start: es, end: ee } of arr) {
      if (cur < es) free.push({ start: cur, end: es });
      if (ee > cur) cur = ee;
    }
    if (cur < end) free.push({ start: cur, end });
    freeByDay.set(day, free);
  }
  return freeByDay;
}

const ScheduleController = {
  async getSchedule(req, res) {
    try {
      const schedule = await Schedule.findByUserId(req.userId);
      res.json({ success: true, schedule: schedule || null });
    } catch (e) {
      console.error("getSchedule error:", e);
      res.status(500).json({ error: "Failed to fetch schedule" });
    }
  },

  async createSchedule(req, res) {
    try {
      const existing = await Schedule.findByUserId(req.userId);
      if (existing) return res.json({ success: true, schedule: existing });
      const created = await Schedule.getOrCreate(req.userId);
      if (req.body?.timezone || req.body?.preferences) {
        await created.update({
          timezone: req.body.timezone ?? null,
          preferences: req.body.preferences ?? null,
        });
      }
      res.status(201).json({ success: true, schedule: created });
    } catch (e) {
      console.error("createSchedule error:", e);
      res.status(500).json({ error: "Failed to create schedule" });
    }
  },

  async updateSchedule(req, res) {
    try {
      const schedule = await Schedule.findByUserId(req.userId);
      if (!schedule)
        return res.status(404).json({ error: "Schedule not found" });
      const updated = await schedule.update({
        timezone: req.body?.timezone ?? schedule.timezone,
        preferences: req.body?.preferences ?? schedule.preferences,
      });
      res.json({ success: true, schedule: updated });
    } catch (e) {
      console.error("updateSchedule error:", e);
      res.status(500).json({ error: "Failed to update schedule" });
    }
  },

  // list expanded events within optional ?from&to
  async listEvents(req, res) {
    try {
      const schedule = await ensureSchedule(req.userId);
      const events = await Event.listForSchedule(schedule.id, {
        from: req.query.from,
        to: req.query.to,
      });
      res.json({ success: true, events });
    } catch (e) {
      console.error("listEvents error:", e);
      res.status(500).json({ error: "Failed to list events" });
    }
  },

  async createEvent(req, res) {
    try {
      const schedule = await ensureSchedule(req.userId);
      const category = String(req.body.category || "")
        .toLowerCase()
        .trim();

      const created = await Event.create({
        scheduleId: schedule.id,
        category,
        title: req.body.title,
        startAt: req.body.start_at,
        endAt: req.body.end_at ?? null,
        notes: req.body.notes ?? null,
        recurrence_rule: req.body.recurrence_rule || "none",
        recurrence_until: req.body.recurrence_until || null,
      });
      res.status(201).json({ success: true, event: created });
    } catch (e) {
      console.error("createEvent error:", e);
      res.status(500).json({ error: "Failed to create event" });
    }
  },

  async getEventById(req, res) {
    try {
      const owned = await assertOwnsEvent(req.userId, req.params.id);
      if (!owned) return res.status(404).json({ error: "Event not found" });
      res.json({ success: true, event: owned.evt });
    } catch (e) {
      console.error("getEventById error:", e);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  },

  async updateEvent(req, res) {
    try {
      const owned = await assertOwnsEvent(req.userId, req.params.id);
      if (!owned) return res.status(404).json({ error: "Event not found" });
      const patch = { ...req.body };
      if (patch.category)
        patch.category = String(patch.category).toLowerCase().trim();

      const updated = await owned.evt.update(patch);
      res.json({ success: true, event: updated });
    } catch (e) {
      console.error("updateEvent error:", e);
      res.status(500).json({ error: "Failed to update event" });
    }
  },

  async deleteEvent(req, res) {
    try {
      const owned = await assertOwnsEvent(req.userId, req.params.id);
      if (!owned) return res.status(404).json({ error: "Event not found" });
      await owned.evt.delete();
      res.json({ success: true });
    } catch (e) {
      console.error("deleteEvent error:", e);
      res.status(500).json({ error: "Failed to delete event" });
    }
  },

  // optional suggestions (unchanged behavior)
  async suggestTimes(req, res) {
    try {
      const horizonDays = Number(req.body?.horizonDays ?? 7);
      const schedule = await ensureSchedule(req.userId);

      const [{ rows: fRows }, { rows: nRows }] = await Promise.all([
        pool.query(`SELECT * FROM fitness_profiles WHERE user_id=$1`, [
          req.userId,
        ]),
        pool.query(`SELECT * FROM nutrition_profiles WHERE user_id=$1`, [
          req.userId,
        ]),
      ]);
      const fitness = fRows[0] || {};
      const nutrition = nRows[0] || {};

      const from = new Date();
      const to = new Date(Date.now() + horizonDays * 24 * 3600 * 1000);
      const events = await Event.listForSchedule(schedule.id, {
        from: from.toISOString(),
        to: to.toISOString(),
      });

      const freeByDay = computeFreeSlots(events);
      const suggestions = [];

      const daysPerWeek = Math.max(
        1,
        Math.min(6, Number(fitness.days_per_week ?? 3))
      );
      const sessionMin = Math.max(20, Number(fitness.session_length_min ?? 45));
      let needed = daysPerWeek;

      for (const [day, slots] of freeByDay.entries()) {
        if (needed <= 0) break;
        for (const slot of slots) {
          const lenMin = Math.floor((slot.end - slot.start) / 60000);
          const hour = new Date(slot.start).getUTCHours();
          const preferred =
            (hour >= 6 && hour < 9) || (hour >= 17 && hour < 20);
          if (lenMin >= sessionMin && preferred) {
            const start = new Date(slot.start);
            const end = new Date(start.getTime() + sessionMin * 60000);
            suggestions.push({
              type: "workout",
              title: "Workout",
              start_at: start.toISOString(),
              end_at: end.toISOString(),
              reason: `Fits your ${sessionMin} min session; preferred time window.`,
            });
            needed--;
            break;
          }
        }
      }

      const mealPrepMin = nutrition?.macros ? 120 : 90;
      outer: for (const [day, slots] of freeByDay.entries()) {
        for (const slot of slots) {
          const startH = new Date(slot.start).getUTCHours();
          const len = Math.floor((slot.end - slot.start) / 60000);
          if (startH >= 16 && len >= mealPrepMin) {
            const start = new Date(slot.start);
            const end = new Date(start.getTime() + mealPrepMin * 60000);
            suggestions.push({
              type: "meal_prep",
              title: "Meal Prep",
              start_at: start.toISOString(),
              end_at: end.toISOString(),
              reason: `Evening block ≥ ${mealPrepMin} min to prep for your targets.`,
            });
            break outer;
          }
        }
      }

      res.json({ suggestions });
    } catch (e) {
      console.error("suggestTimes error:", e);
      res.status(500).json({ error: "Failed to compute suggestions" });
    }
  },
};

module.exports = ScheduleController;
