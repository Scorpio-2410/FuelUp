// backend/controllers/scheduleController.js
const Schedule = require("../models/schedule");
const Event = require("../models/event");
const FitnessPlan = require("../models/fitnessPlan");
const axios = require("axios");
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
        Math.min(7, Number(fitness.days_per_week ?? prefs.days_per_week ?? 3)) // Allow up to 7 days
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
        Math.min(7, Number(prefs.days_per_week ?? fitness.days_per_week ?? 3)) // Allow up to 7 days
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

  /* --------- AI: CREATE PLAN (IF MISSING) AND SCHEDULE DAYS WEEKLY --------- */
  async planAndScheduleAi(req, res) {
    try {
      const schedule = await ensureSchedule(req.userId);
      // Read preferences early so we can honor days_per_week when generating AI plan
      const prefsEarly = await readSchedulePrefs(schedule.id);

      // CLEAR OUT OLD AI-GENERATED PLANS AND EVENTS
      // This allows users to regenerate when they change their days_per_week preference
      console.log(
        "[planAndScheduleAi] Clearing old AI-generated plans and events..."
      );

      // 1) Find all AI-generated fitness plans (identified by notes containing "Auto-created from AI suggestion")
      const { rows: aiPlans } = await pool.query(
        `SELECT id FROM fitness_plans 
         WHERE user_id=$1 
         AND status <> 'archived' 
         AND (notes ILIKE '%Auto-created from AI suggestion%' OR notes ILIKE '%AI Weekly Plan%')`,
        [req.userId]
      );

      // 2) Delete those plans (this will cascade delete their exercises)
      if (aiPlans && aiPlans.length > 0) {
        const planIds = aiPlans.map((p) => p.id);
        await pool.query(`DELETE FROM fitness_plans WHERE id = ANY($1)`, [
          planIds,
        ]);
        console.log(
          `[planAndScheduleAi] Deleted ${planIds.length} old AI-generated plans`
        );

        // 3) Delete events that reference these plans
        const existingEvents = await Event.listForSchedule(schedule.id);
        for (const ev of existingEvents) {
          try {
            const notes = ev.notes;
            if (!notes) continue;
            const obj = typeof notes === "string" ? JSON.parse(notes) : notes;
            if (
              obj &&
              (obj.type === "workout_session" || obj.type === "plan_session") &&
              planIds.includes(obj.plan_id)
            ) {
              await pool.query(`DELETE FROM events WHERE id=$1`, [
                ev.dbId || ev.id,
              ]);
            }
          } catch (e) {
            // ignore parse errors
          }
        }
        console.log(
          "[planAndScheduleAi] Deleted old events associated with AI plans"
        );
      }

      // 1) Check for existing non-archived fitness plan (non-AI generated)
      // We already deleted AI plans above, so only manually created plans remain
      const { rows: existingPlans } = await pool.query(
        `SELECT id, name FROM fitness_plans WHERE user_id=$1 AND status <> 'archived' ORDER BY created_at DESC LIMIT 1`,
        [req.userId]
      );

      let plan = null;
      let aiPlan = null;

      // Always generate a new AI plan since we cleared the old ones
      if (true) {
        // Generate an AI plan via internal HTTP to our own endpoint
        const { rows: fRows } = await pool.query(
          `SELECT goal, activity_level, days_per_week, height_cm, weight_kg FROM fitness_profiles WHERE user_id=$1 LIMIT 1`,
          [req.userId]
        );
        const prof = fRows[0] || {};

        // Resolve desired days per week: request override > schedule prefs > fitness profile > default
        const desiredDays = Math.max(
          1,
          Math.min(
            7, // Allow up to 7 days per week
            Number(
              req.body?.days_per_week ??
                req.body?.daysPerWeek ??
                prefsEarly.days_per_week ??
                prof.days_per_week ??
                4
            )
          )
        );

        console.log("[planAndScheduleAi] Days per week resolution:", {
          from_request_body:
            req.body?.days_per_week ?? req.body?.daysPerWeek ?? null,
          from_schedule_prefs: prefsEarly.days_per_week ?? null,
          from_fitness_profile: prof.days_per_week ?? null,
          final_desired_days: desiredDays,
        });

        // Base URL of this server
        const baseUrl =
          process.env.BASE_URL ||
          `http://localhost:${process.env.PORT || 4000}`;
        const resp = await axios.post(
          `${baseUrl}/api/ai/suggest-workout`,
          {
            goal: prof.goal || null,
            activityLevel: prof.activity_level || null,
            daysPerWeek: desiredDays,
            height: prof.height_cm || null,
            weight: prof.weight_kg || null,
            exercises_per_day: req.body?.exercises_per_day || undefined,
          },
          {
            timeout: 30000,
            headers: { Authorization: req.headers.authorization || "" },
          }
        );

        // The AI endpoint returns { workout: { plan_name, days } }, extract the workout object
        aiPlan = resp.data?.workout || resp.data;
        if (!aiPlan || !aiPlan.days || !Array.isArray(aiPlan.days)) {
          console.error(
            "[planAndScheduleAi] AI plan generation failed or returned invalid data:",
            resp.data
          );
          return res.status(500).json({
            error: "AI plan generation failed - no workout data returned",
          });
        }

        console.log("[planAndScheduleAi] AI plan generated successfully:", {
          plan_name: aiPlan.plan_name,
          days_count: aiPlan.days?.length,
          exercises_per_day: aiPlan.days?.map((d) => d.exercises?.length || 0),
        });

        // We don't create a single master plan anymore - we'll create individual plans per day below
        plan = null;
      }

      const planned = aiPlan?.days || [];
      if (!planned.length) {
        console.error("[planAndScheduleAi] No days in AI plan");
        return res.status(400).json({ error: "AI plan has no workout days" });
      }

      // Verify each day has exercises
      const emptyDays = planned.filter(
        (d) => !d.exercises || d.exercises.length === 0
      );
      if (emptyDays.length > 0) {
        console.warn("[planAndScheduleAi] Some days have no exercises:", {
          total_days: planned.length,
          empty_days: emptyDays.length,
        });
      }

      // Preferences for time/duration and preferred weekdays
      const prefs = await readSchedulePrefs(schedule.id);
      const sessionMinPref = Number(prefs.workout_session_minutes);
      const sessionMin = Math.max(
        20,
        isNaN(sessionMinPref) ? 60 : sessionMinPref
      );
      const preferredDays = Array.isArray(prefs.preferred_workout_days)
        ? prefs.preferred_workout_days
            .map(Number)
            .filter((n) => n >= 0 && n <= 6)
        : [1, 3, 5, 2, 4, 6, 0]; // spread across week

      // Anchor at the upcoming Monday
      const today = new Date();
      const weekStart = mondayOfLocal(today);

      // Map each plan day to a weekday (repeat weekly)
      const pickWeekdayForIndex = (idx) => preferredDays[idx] ?? (1 + idx) % 7;

      // First compute all target datetimes, then assign sequential day numbers by chronological order
      const pre = [];
      for (let i = 0; i < planned.length; i++) {
        const day = planned[i];
        const weekday = pickWeekdayForIndex(i);

        const base = new Date(weekStart);
        base.setDate(weekStart.getDate() + ((weekday + 7 - base.getDay()) % 7));
        base.setHours(7, 0, 0, 0); // 07:00 local default
        const end = new Date(base.getTime() + sessionMin * 60000);

        // derive quick summary bits for later UI
        const rests = (day.exercises || [])
          .map((ex) => Number(ex?.rest_seconds) || 0)
          .filter((n) => n > 0);
        const rest_min = rests.length ? Math.min(...rests) : null;
        const rest_max = rests.length ? Math.max(...rests) : null;
        const exercise_count = (day.exercises || []).length;

        pre.push({
          plannedIndex: i + 1,
          base,
          end,
          focus: day.focus,
          rest_min,
          rest_max,
          exercise_count,
          exercises: (day.exercises || []).map((ex) => ({
            id: ex.exercise_id,
            externalId: String(ex.exercise_id),
            source: "local",
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.rest_seconds,
            estimated_seconds: ex.estimated_seconds,
            external_id: ex.external_id || null,
            secondary_muscles: ex.secondary_muscles || null,
          })),
        });
      }

      // Sort by date ascending so Day 1 is the earliest in the week, then Day 2, etc.
      pre.sort((a, b) => a.base.getTime() - b.base.getTime());

      const created = [];
      for (let order = 0; order < pre.length; order++) {
        const s = pre[order];

        // Create a separate plan for each day so "My Plans" shows them organized
        const dayPlanName = `Day ${order + 1} - ${s.focus || "Workout"}`;
        const dayPlan = await FitnessPlan.create(req.userId, {
          name: dayPlanName,
          status: "active",
          notes: `Auto-created from AI suggestion (${
            aiPlan.plan_name || "AI Weekly Plan"
          })`,
        });

        // Save this day's exercises to its own plan
        for (const ex of s.exercises || []) {
          try {
            await pool.query(
              `INSERT INTO fitness_plan_exercises
                 (plan_id, source, external_id, name, gif_url, body_part, target, equipment)
               VALUES ($1,'local',$2,$3,NULL,NULL,NULL,NULL)
               ON CONFLICT (plan_id, source, external_id) DO NOTHING`,
              [dayPlan.id, String(ex.id), ex.name]
            );
          } catch (e) {
            console.warn(`Failed to add exercise ${ex.name} to plan:`, e);
          }
        }

        const summaryParts = [
          s.focus || "Workout",
          `${s.exercise_count} exercise${s.exercise_count === 1 ? "" : "s"}`,
        ];
        if (s.rest_min != null) {
          summaryParts.push(
            s.rest_min === s.rest_max
              ? `${s.rest_min}s rest`
              : `${s.rest_min}–${s.rest_max}s rest`
          );
        }
        const notesObj = {
          type: "workout_session",
          plan_id: dayPlan.id,
          plan_name: dayPlan.name,
          day_index: order + 1, // chronological day number
          planned_day_index: s.plannedIndex, // original index within plan
          focus: s.focus,
          summary: summaryParts.join(" • "),
          exercise_count: s.exercise_count,
          rest_min: s.rest_min,
          rest_max: s.rest_max,
          exercises: s.exercises,
        };

        const ev = await Event.create({
          scheduleId: schedule.id,
          category: "workout",
          title: `${s.focus || "Workout"} (Day ${order + 1})`,
          startAt: s.base.toISOString(),
          endAt: s.end.toISOString(),
          notes: JSON.stringify(notesObj),
          recurrence_rule: "weekly",
          recurrence_until: null,
        });
        created.push(ev);
      }

      return res.status(201).json({
        success: true,
        plan_id: created.length > 0 ? created[0].id : null,
        created_count: created.length,
        events: created,
      });
    } catch (e) {
      console.error("planAndScheduleAi error:", e);
      res.status(500).json({ error: "Failed to create and schedule AI plan" });
    }
  },

  /* --------- SCHEDULE EXISTING PLANS WEEKLY (ONGOING) --------- */
  async schedulePlansWeekly(req, res) {
    try {
      const schedule = await ensureSchedule(req.userId);

      // Fetch active plans for user
      const { rows: plans } = await pool.query(
        `SELECT id, name FROM fitness_plans WHERE user_id=$1 AND status <> 'archived' ORDER BY created_at ASC`,
        [req.userId]
      );
      if (!plans || plans.length === 0) {
        return res.status(400).json({ error: "No active plans to schedule" });
      }

      // Read preferences (preferred_workout_days, session length)
      const prefs = await readSchedulePrefs(schedule.id);
      const sessionMinPref = Number(prefs.workout_session_minutes);
      const sessionMin = Math.max(
        20,
        isNaN(sessionMinPref) ? 60 : sessionMinPref
      );
      const preferredDays = Array.isArray(prefs.preferred_workout_days)
        ? prefs.preferred_workout_days
            .map(Number)
            .filter((n) => n >= 0 && n <= 6)
        : [1, 3, 5, 2, 4, 6, 0];

      // Anchor to current week's Monday (local)
      const today = new Date();
      const weekStart = mondayOfLocal(today);

      // Existing events: pull all to avoid duplicates per plan_id
      const existingEvents = await Event.listForSchedule(schedule.id);
      const hasEventForPlan = new Set();
      for (const ev of existingEvents) {
        try {
          const notes = ev.notes;
          if (!notes) continue;
          const obj = typeof notes === "string" ? JSON.parse(notes) : notes;
          if (
            obj &&
            (obj.type === "plan_session" || obj.type === "workout_session") &&
            obj.plan_id
          ) {
            hasEventForPlan.add(Number(obj.plan_id));
          }
        } catch {}
      }

      const created = [];

      // Helper to get first occurrence date for a given weekday and week offset
      const dateForWeekday = (baseMonday, weekday, weekOffset) => {
        const d = new Date(baseMonday);
        d.setDate(d.getDate() + weekOffset * 7);
        const dow = d.getDay();
        const delta = (weekday + 7 - dow) % 7;
        d.setDate(d.getDate() + delta);
        d.setHours(7, 0, 0, 0); // default 07:00 local
        return d;
      };

      // For each plan, schedule one weekly event, distributing across current and subsequent weeks if >7 plans
      for (let i = 0; i < plans.length; i++) {
        const plan = plans[i];
        if (hasEventForPlan.has(Number(plan.id))) continue; // skip if already scheduled

        const weekday = preferredDays[i % preferredDays.length];
        const weekOffset = Math.floor(i / preferredDays.length);
        const start = dateForWeekday(weekStart, weekday, weekOffset);
        const end = new Date(start.getTime() + sessionMin * 60000);

        // Fetch exercises saved to this plan (optional metadata)
        let exercises = [];
        try {
          const exq = await pool.query(
            `SELECT source, external_id, name, gif_url, body_part, target, equipment
               FROM fitness_plan_exercises
              WHERE plan_id=$1
              ORDER BY added_at ASC`,
            [plan.id]
          );
          exercises = (exq.rows || []).map((r) => ({
            id: r.external_id || null,
            externalId: r.external_id || null,
            source: r.source || "local",
            name: r.name || null,
            gif_url: r.gif_url || null,
            bodyPart: r.body_part || null,
            target: r.target || null,
            equipment: r.equipment || null,
            external_id: r.external_id || null,
            // Add default training parameters so exercises are clickable
            sets: 3,
            reps: "10",
            rest_seconds: 60,
            estimated_seconds: 120,
          }));
        } catch {}

        // Compute rest range for summary
        const rests = exercises
          .map((e) => Number(e.rest_seconds) || 0)
          .filter((n) => n > 0);
        const rest_min = rests.length ? Math.min(...rests) : null;
        const rest_max = rests.length ? Math.max(...rests) : null;
        const exercise_count = exercises.length;

        const summaryParts = [
          plan.name || "Workout",
          `${exercise_count} exercise${exercise_count === 1 ? "" : "s"}`,
        ];
        if (rest_min != null) {
          summaryParts.push(
            rest_min === rest_max
              ? `${rest_min}s rest`
              : `${rest_min}–${rest_max}s rest`
          );
        }

        const notesObj = {
          type: "plan_session",
          plan_id: plan.id,
          plan_name: plan.name,
          summary: summaryParts.join(" • "),
          exercise_count,
          rest_min,
          rest_max,
          exercises,
        };

        const ev = await Event.create({
          scheduleId: schedule.id,
          category: "workout",
          title: plan.name || "Workout",
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          notes: JSON.stringify(notesObj),
          recurrence_rule: "weekly",
          recurrence_until: null,
        });
        created.push(ev);
      }

      return res.status(201).json({
        success: true,
        created_count: created.length,
        events: created,
      });
    } catch (e) {
      console.error("schedulePlansWeekly error:", e);
      res.status(500).json({ error: "Failed to schedule existing plans" });
    }
  },
};

module.exports = ScheduleController;
