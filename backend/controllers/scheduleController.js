// backend/controllers/scheduleController.js
const Schedule = require("../models/schedule");
const Event = require("../models/event");
const { pool } = require("../config/database");

const ensureSchedule = async (userId) => Schedule.getOrCreate(userId);

// Recover the real DB id if a synthetic occurrence id was passed.
const coerceDbId = (raw) => {
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  if (n > 9_000_000_000) return Math.floor(n / 1_000_000);
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

/* ---------------- local-time helpers ---------------- */
const pad2 = (n) => String(n).padStart(2, "0");
const ymdLocal = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const atLocal = (ymdStr, hour = 0, minute = 0) => {
  const [Y, M, D] = ymdStr.split("-").map(Number);
  const x = new Date();
  x.setFullYear(Y, M - 1, D);
  x.setHours(hour, minute, 0, 0);
  return x;
};

const mondayOfLocal = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay(); // 0=Sun..6=Sat (LOCAL)
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + mondayOffset);
  return x; // local Monday 00:00
};

/** Safely read JSONB preferences from schedules table */
async function readSchedulePrefs(scheduleId) {
  const { rows } = await pool.query(
    `SELECT preferences FROM schedules WHERE id=$1`,
    [scheduleId]
  );
  const raw = rows[0]?.preferences;
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
}

/**
 * Compute free windows per local day from a list of events.
 * - Groups by local YYYY-MM-DD using the *start* timestamp.
 * - Treats missing end as 30 minutes after start.
 * - Bounds each day to [dayStart, dayEnd] local hours.
 */
function computeFreeSlotsLocal(events, dayStart = 6, dayEnd = 22) {
  const byDay = new Map();

  for (const e of events) {
    const s = new Date(e.startAt || e.start_at);
    const eEnd =
      e.endAt || e.end_at
        ? new Date(e.endAt || e.end_at)
        : new Date(s.getTime() + 30 * 60000);
    const key = ymdLocal(s);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push({ start: s, end: eEnd });
  }

  for (const arr of byDay.values()) arr.sort((a, b) => a.start - b.start);

  const freeByDay = new Map();
  for (const [key, arr] of byDay.entries()) {
    const dayStartDt = atLocal(key, dayStart, 0);
    const dayEndDt = atLocal(key, dayEnd, 0);
    let cur = dayStartDt;
    const free = [];
    for (const { start: es, end: ee } of arr) {
      if (cur < es) free.push({ start: cur, end: es });
      if (ee > cur) cur = ee;
    }
    if (cur < dayEndDt) free.push({ start: cur, end: dayEndDt });
    freeByDay.set(key, free);
  }

  return freeByDay;
}

/* --------------------------------------------------------------------- */

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

  /* -------------------- SUGGEST WINDOWS -------------------- */
  async suggestTimes(req, res) {
    try {
      const horizonDays = Number(req.body?.horizonDays ?? 7);
      const schedule = await ensureSchedule(req.userId);

      // read fitness (days per week only; no session_length_min column)
      const [{ rows: fRows }] = await Promise.all([
        pool.query(
          `SELECT days_per_week FROM fitness_profiles WHERE user_id=$1`,
          [req.userId]
        ),
      ]);
      const fitness = fRows[0] || {};

      // read schedule preferences (JSONB)
      const prefs = await readSchedulePrefs(schedule.id);

      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(to.getDate() + horizonDays);
      to.setHours(0, 0, 0, 0);

      const events = await Event.listForSchedule(schedule.id, {
        from: from.toISOString(),
        to: to.toISOString(),
      });

      const freeByDay = computeFreeSlotsLocal(events);
      const suggestions = [];

      const daysPerWeek = Math.max(
        1,
        Math.min(6, Number(fitness.days_per_week ?? prefs.days_per_week ?? 3))
      );

      // Use preference if provided, otherwise default to 45 minutes.
      const sessionMinPref = Number(prefs.workout_session_minutes);
      const sessionMin = Math.max(
        20,
        isNaN(sessionMinPref) ? 45 : sessionMinPref
      );

      // Walk each day; treat empty days as 06:00–22:00 free
      const cur = new Date(from);
      let needed = daysPerWeek;
      while (cur < to && needed > 0) {
        const key = ymdLocal(cur);
        const slots = freeByDay.get(key) || [
          { start: atLocal(key, 6), end: atLocal(key, 22) },
        ];

        const pick = (window) =>
          slots.find(({ start, end }) => {
            const h = start.getHours(); // local
            const okWindow =
              window === "am" ? h >= 6 && h < 10 : h >= 17 && h < 20;
            const len = Math.floor((end - start) / 60000);
            return okWindow && len >= sessionMin;
          });

        let chosen = pick("am") || pick("pm");
        if (!chosen) {
          const best = slots
            .map((s) => ({ ...s, len: (s.end - s.start) / 60000 }))
            .filter((s) => s.len >= sessionMin)
            .sort((a, b) => b.len - a.len)[0];
          if (best) chosen = best;
        }

        if (chosen) {
          const start = new Date(chosen.start);
          const end = new Date(start.getTime() + sessionMin * 60000);
          suggestions.push({
            type: "workout",
            title: "Workout",
            start_at: start.toISOString(),
            end_at: end.toISOString(),
            reason: `Fits ${sessionMin} min in your day.`,
          });
          needed--;
        }

        cur.setDate(cur.getDate() + 1);
      }

      res.json({ suggestions });
    } catch (e) {
      console.error("suggestTimes error:", e);
      res.status(500).json({ error: "Failed to compute suggestions" });
    }
  },

  /* --------- AUTO-CREATE WORKOUTS (LOCAL + STRICTLY CURRENT WEEK) --------- */
  async autoPlanWorkouts(req, res) {
    try {
      const schedule = await ensureSchedule(req.userId);

      // Only fetch columns that exist
      const { rows: fRows } = await pool.query(
        `SELECT days_per_week FROM fitness_profiles WHERE user_id=$1`,
        [req.userId]
      );
      const fitness = fRows[0] || {};

      // Preferences may contain: preferred_workout_days (array of 0..6),
      // workout_session_minutes (number), days_per_week override, etc.
      const prefs = await readSchedulePrefs(schedule.id);

      // How many days we *want* this week
      const targetPerWeek = Math.max(
        1,
        Math.min(6, Number(prefs.days_per_week ?? fitness.days_per_week ?? 3))
      );

      // Session length: default 120 minutes unless explicitly configured
      const sessionMinPref = Number(prefs.workout_session_minutes);
      const sessionMin = Math.max(
        20,
        isNaN(sessionMinPref) ? 120 : sessionMinPref
      );

      // Preferred weekdays (0..6). If not set, fall back to Mon/Wed/Fri, then Tue/Thu/Sat.
      const preferredDays = Array.isArray(prefs.preferred_workout_days)
        ? prefs.preferred_workout_days
            .map(Number)
            .filter((n) => n >= 0 && n <= 6)
        : [1, 3, 5, 2, 4, 6];

      // ----- Bound to the current local week -----
      const today = new Date();
      const weekStart = mondayOfLocal(today); // local Mon 00:00
      const weekEndOpen = new Date(weekStart);
      weekEndOpen.setDate(weekEndOpen.getDate() + 7); // next Mon 00:00

      // Existing events within this week
      const existing = await Event.listForSchedule(schedule.id, {
        from: weekStart.toISOString(),
        to: weekEndOpen.toISOString(),
      });

      // Mark which weekdays already have a workout (any workout, not just auto-planned)
      const existingWorkoutDays = new Set(
        existing
          .filter((e) => String(e.category).toLowerCase() === "workout")
          .map((e) => {
            const d = new Date(e.startAt || e.start_at);
            return d.getDay(); // 0..6 local
          })
      );

      // Count how many workouts already scheduled this week
      const existingCount = Array.from(existingWorkoutDays).length;

      // If we've already met or exceeded the target, nothing to do
      if (existingCount >= targetPerWeek) {
        return res.status(200).json({
          success: true,
          created_count: 0,
          events: [],
          message: "Weekly workout target already satisfied.",
        });
      }

      const remainingNeeded = Math.max(0, targetPerWeek - existingCount);

      // Free-time map for this week (06:00–22:00 bounds)
      const freeByDay = computeFreeSlotsLocal(existing, 6, 22);

      const created = [];
      let planned = 0;

      // Walk the week once; if a day is preferred AND doesn't already have a workout,
      // place ONE session (AM preferred, then PM, then longest window).
      const cursor = new Date(weekStart);
      while (cursor < weekEndOpen && planned < remainingNeeded) {
        const weekday = cursor.getDay(); // local 0..6

        // Skip non-preferred days or days that already have a workout
        if (
          !preferredDays.includes(weekday) ||
          existingWorkoutDays.has(weekday)
        ) {
          cursor.setDate(cursor.getDate() + 1);
          continue;
        }

        const key = ymdLocal(cursor);
        const slots = freeByDay.get(key) || [
          { start: atLocal(key, 6), end: atLocal(key, 22) },
        ];

        const pick = (window) =>
          slots.find(({ start, end }) => {
            const h = start.getHours(); // LOCAL hour
            const okWindow =
              window === "am" ? h >= 6 && h < 10 : h >= 17 && h < 20;
            const len = Math.floor((end - start) / 60000);
            return okWindow && len >= sessionMin;
          });

        let slot = pick("am") || pick("pm");
        if (!slot) {
          const best = slots
            .map((s) => ({ ...s, len: (s.end - s.start) / 60000 }))
            .filter((s) => s.len >= sessionMin)
            .sort((a, b) => b.len - a.len)[0];
          if (best) slot = best;
        }

        if (slot) {
          const start = new Date(slot.start);
          const end = new Date(start.getTime() + sessionMin * 60000);

          const ev = await Event.create({
            scheduleId: schedule.id,
            category: "workout",
            title: "Workout",
            startAt: start.toISOString(),
            endAt: end.toISOString(),
            notes: "Auto-planned",
            recurrence_rule: "none",
            recurrence_until: null,
          });

          created.push(ev);
          planned++;
          // Mark this weekday as now having a workout to prevent another on the same day
          existingWorkoutDays.add(weekday);
        }

        cursor.setDate(cursor.getDate() + 1);
      }

      return res.status(201).json({
        success: true,
        created_count: created.length,
        events: created,
      });
    } catch (e) {
      console.error("autoPlanWorkouts error:", e);
      res.status(500).json({ error: "Failed to auto-plan workouts" });
    }
  },
};

module.exports = ScheduleController;
