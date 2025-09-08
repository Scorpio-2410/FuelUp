const Schedule = require("../models/Schedule");
const {
  buildWeek,
  expandWeekEvents,
  freeWindows,
  spanToMin,
  pickGymDuration,
  chooseSplit,
} = require("../utils/scheduler");

// create or update user preferences in-memory (later move to DB if you want)
const PREFS = {};

exports.upsertPreferences = async (req, res) => {
  const {
    userId,
    gymFrequencyPerWeek = 3,
    preferredWindows,
    goals,
    minGymMin,
    maxGymMin,
    includeMealPrep,
  } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  PREFS[userId] = {
    userId,
    gymFrequencyPerWeek,
    preferredWindows,
    goals,
    minGymMin,
    maxGymMin,
    includeMealPrep,
  };
  res.json({ ok: true, prefs: PREFS[userId] });
};

// save events
exports.syncEvents = async (req, res) => {
  const { userId, events = [] } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  // replace user’s events for now
  await Schedule.deleteMany({ userId });
  await Schedule.insertMany(events.map((e) => ({ ...e, userId })));

  res.json({ ok: true, count: events.length });
};

// get suggestions
exports.getSuggestions = async (req, res) => {
  const { userId, weekStart } = req.query;
  if (!userId || !weekStart)
    return res.status(400).json({ error: "userId and weekStart required" });

  const prefs = PREFS[userId] || {
    gymFrequencyPerWeek: 3,
    preferredWindows: ["17:00-19:30", "06:30-08:30"],
    goals: ["hypertrophy"],
    minGymMin: 35,
    maxGymMin: 70,
    includeMealPrep: true,
  };

  const events = await Schedule.find({ userId });
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

    // gym
    if (remainingGym > 0) {
      const wins = prefs.preferredWindows?.length
        ? prefs.preferredWindows
        : ["17:00-19:30", "06:30-08:30"];
      let placed = false;
      for (const pref of wins) {
        const [ps, pe] = spanToMin(pref);
        for (const [fs, fe] of free) {
          const s = Math.max(ps, fs),
            e = Math.min(pe, fe),
            win = e - s;
          const dur = pickGymDuration(win, prefs);
          if (dur > 0) {
            const hhmm = (m) =>
              `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(
                m % 60
              ).padStart(2, "0")}`;
            const time = `${hhmm(s)}-${hhmm(s + dur)}`;
            const split = chooseSplit(prefs.goals, new Date(d).getDay());
            suggestions.push({
              id: `sg-${d}-${s}`,
              userId,
              date: d,
              time,
              title: "Suggested Gym",
              subtitle: "Fits your goals",
              category: "gym",
              plan: { block: split, minutes: dur },
            });
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
      if (placed) remainingGym--;
    }

    // meal-prep
    if (prefs.includeMealPrep) {
      for (const [fs, fe] of free) {
        const win = fe - fs;
        if (win >= 45) {
          const hhmm = (m) =>
            `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(
              m % 60
            ).padStart(2, "0")}`;
          const time = `${hhmm(fs)}-${hhmm(Math.min(fe, fs + 90))}`;
          suggestions.push({
            id: `mp-${d}-${fs}`,
            userId,
            date: d,
            time,
            title: "Meal Prep",
            subtitle: "Batch cooking slot",
            category: "mealprep",
            plan: { block: "MealPrep", minutes: Math.min(win, 90) },
          });
          break;
        }
      }
    }
  }

  res.json({ week: days, suggestions });
};
