// backend/controllers/scheduleController.js
const Schedule = require("../models/Schedule"); // PG model helpers

// ----- helpers (inline) -----
const iso = (d) => d.toISOString().slice(0, 10); // date -> YYYY-MM-DD
const hmToMin = (s) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}; // "HH:MM" -> minutes
const spanToMin = (span) => {
  const [a, b] = span.split("-");
  return [hmToMin(a), hmToMin(b)];
}; // "HH:MM-HH:MM" -> [m,m]
const hhmm = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(
    2,
    "0"
  )}`; // minutes -> "HH:MM"

function buildWeek(weekStartISO) {
  // Sunday start -> 7 ISO dates
  const s = new Date(weekStartISO);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(s);
    d.setDate(s.getDate() + i);
    out.push(iso(d));
  }
  return out;
}

function expandWeekEvents(events, weekStartISO) {
  // expand recurring into this week
  const days = buildWeek(weekStartISO);
  const byDay = Object.fromEntries(days.map((d) => [d, []]));
  for (const e of events) {
    if (!e.recurrence || e.recurrence.freq === "none") {
      if (e.date && byDay[e.date]) byDay[e.date].push(e);
      continue;
    }
    if (e.recurrence.freq === "daily") {
      for (const d of days) byDay[d].push({ ...e, date: d });
      continue;
    }
    if (e.recurrence.freq === "weekly") {
      for (const d of days) {
        const dow = new Date(d).getDay();
        if ((e.recurrence.daysOfWeek || []).includes(dow))
          byDay[d].push({ ...e, date: d });
      }
    }
  }
  for (const d of days) byDay[d].sort((a, b) => a.time.localeCompare(b.time));
  return byDay;
}

function freeWindows(busySpans, dayRange = "06:00-22:30") {
  // gaps within day
  const [ds, de] = spanToMin(dayRange);
  const busy = busySpans.map(spanToMin).sort((a, b) => a[0] - b[0]);
  const out = [];
  let cur = ds;
  for (const [s, e] of busy) {
    if (s > cur) out.push([cur, s]);
    cur = Math.max(cur, e);
  }
  if (cur < de) out.push([cur, de]);
  return out;
}

function pickGymDuration(winMin, prefs) {
  // choose duration from window
  const min = prefs.minGymMin ?? 35;
  const max = prefs.maxGymMin ?? 70;
  if (winMin < min) return 0;
  if (winMin >= max + 20) return max;
  if (winMin < max) return Math.max(min, Math.floor(winMin * 0.8));
  return max;
}

function chooseSplit(goals, weekday) {
  // 0=Sun..6=Sat
  if (!goals || goals.length === 0) return "Full";
  if (goals.includes("endurance") || goals.includes("fatloss"))
    return weekday % 2 === 0 ? "Cardio" : "Full";
  if (goals.includes("strength")) return weekday % 2 === 0 ? "Upper" : "Lower";
  return weekday % 4 === 0
    ? "Push"
    : weekday % 4 === 1
    ? "Pull"
    : weekday % 4 === 2
    ? "Lower"
    : "Upper";
}

// ----- controllers -----

// POST /api/schedule/preferences
exports.upsertPreferences = async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    const prefs = await Schedule.upsertPrefs(userId, req.body);
    return res.json({ ok: true, prefs });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

// POST /api/schedule/events/sync
exports.syncEvents = async (req, res) => {
  try {
    const { userId, events = [] } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    const result = await Schedule.replaceEventsForUser(userId, events);
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

// GET /api/schedule/suggestions?userId=..&weekStart=YYYY-MM-DD (Sunday)
exports.getSuggestions = async (req, res) => {
  try {
    const userId = String(req.query.userId || "");
    const weekStart = String(req.query.weekStart || "");
    if (!userId || !weekStart)
      return res.status(400).json({ error: "userId and weekStart required" });

    const prefs = (await Schedule.getPrefs(userId)) || {
      userId,
      gymFrequencyPerWeek: 3,
      preferredWindows: ["17:00-19:30", "06:30-08:30", "12:00-13:30"],
      goals: ["hypertrophy"],
      minGymMin: 35,
      maxGymMin: 70,
      includeMealPrep: true,
    };

    const events = await Schedule.getEventsByUser(userId);
    const days = buildWeek(weekStart);
    const expanded = expandWeekEvents(events, weekStart);

    const existingGym = days.reduce(
      (n, d) =>
        n + (expanded[d] || []).filter((e) => e.category === "gym").length,
      0
    );
    let remainingGym = Math.max(
      0,
      (prefs.gymFrequencyPerWeek || 3) - existingGym
    );

    const suggestions = [];

    for (const d of days) {
      const busy = (expanded[d] || []).map((e) => e.time);
      const free = freeWindows(busy);

      // gym suggestion
      if (remainingGym > 0) {
        const wins = prefs.preferredWindows?.length
          ? prefs.preferredWindows
          : ["17:00-19:30", "06:30-08:30", "12:00-13:30"];
        let placed = false;
        for (const pref of wins) {
          const [ps, pe] = spanToMin(pref);
          for (const [fs, fe] of free) {
            const s = Math.max(ps, fs),
              e = Math.min(pe, fe),
              win = e - s;
            const dur = pickGymDuration(win, prefs);
            if (dur > 0) {
              const time = `${hhmm(s)}-${hhmm(s + dur)}`;
              const split = chooseSplit(prefs.goals, new Date(d).getDay());
              suggestions.push({
                id: `sg-${d}-${s}`,
                userId,
                date: d,
                time,
                title: "Suggested Gym",
                subtitle: "Based on your goals & availability",
                category: "gym",
                confidence: 0.9,
                reason: `Fits free window and ${split} day`,
                plan: {
                  block: split,
                  minutes: dur,
                  focus: (prefs.goals || []).join(", "),
                },
              });
              placed = true;
              break;
            }
          }
          if (placed) break;
        }
        if (placed) remainingGym--;
      }

      // meal prep suggestion
      if (prefs.includeMealPrep) {
        for (const [fs, fe] of free) {
          const win = fe - fs;
          if (win >= 45) {
            suggestions.push({
              id: `mp-${d}-${fs}`,
              userId,
              date: d,
              time: `${hhmm(fs)}-${hhmm(Math.min(fe, fs + 90))}`,
              title: "Meal Prep",
              subtitle: "Batch cooking slot",
              category: "mealprep",
              confidence: 0.7,
              reason: "Free block ≥45 min",
              plan: { block: "MealPrep", minutes: Math.min(win, 90) },
            });
            break;
          }
        }
      }
    }

    return res.json({ week: days, suggestions });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};
