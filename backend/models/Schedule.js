// backend/models/Schedule.js
// Postgres helpers for schedules (events + prefs)
const { pool } = require("../config/database");

// "HH:MM-HH:MM" -> ["HH:MM","HH:MM"]
const toTimes = (span) => {
  const [a, b] = span.split("-");
  return [a, b];
};

// map DB row -> API event object
const rowToEvent = (r) => ({
  id: String(r.id),
  userId: String(r.user_id),
  date: r.event_date ? r.event_date.toISOString().slice(0, 10) : undefined,
  time: `${String(r.start_time).slice(0, 5)}-${String(r.end_time).slice(0, 5)}`,
  title: r.title,
  subtitle: r.subtitle || undefined,
  category: r.category,
  color: r.color || undefined,
  recurrence: r.recurrence || undefined,
});

// replace all events for a user
async function replaceEventsForUser(userId, events) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM schedule_events WHERE user_id = $1", [
      userId,
    ]);

    if (events.length) {
      const insertSQL = `
        INSERT INTO schedule_events
          (user_id, title, subtitle, category, color, event_date, start_time, end_time, recurrence, created_at, updated_at)
        VALUES
          ${events
            .map(
              (_, i) =>
                `($${i * 10 + 1},$${i * 10 + 2},$${i * 10 + 3},$${
                  i * 10 + 4
                },$${i * 10 + 5},$${i * 10 + 6},$${i * 10 + 7},$${
                  i * 10 + 8
                },$${i * 10 + 9}, NOW(), NOW())`
            )
            .join(",")}
        RETURNING id
      `;
      const values = [];
      for (const e of events) {
        const [start, end] = toTimes(e.time);
        values.push(
          userId,
          e.title,
          e.subtitle || null,
          e.category,
          e.color || null,
          e.date || null,
          start,
          end,
          e.recurrence ? JSON.stringify(e.recurrence) : null
        );
      }
      await client.query(insertSQL, values);
    }

    await client.query("COMMIT");
    return { ok: true, count: events.length };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// get all events (one-off + recurring templates)
async function getEventsByUser(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM schedule_events WHERE user_id = $1 ORDER BY event_date NULLS LAST, start_time`,
    [userId]
  );
  return rows.map(rowToEvent);
}

// upsert preferences
async function upsertPrefs(userId, prefs) {
  const {
    gymFrequencyPerWeek = 3,
    preferredWindows = ["17:00-19:30", "06:30-08:30", "12:00-13:30"],
    goals = ["hypertrophy"],
    minGymMin = 35,
    maxGymMin = 70,
    includeMealPrep = true,
  } = prefs || {};

  await pool.query(
    `
    INSERT INTO schedule_prefs
      (user_id, gym_frequency_per_week, preferred_windows, goals, min_gym_min, max_gym_min, include_meal_prep, created_at, updated_at)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      gym_frequency_per_week = EXCLUDED.gym_frequency_per_week,
      preferred_windows = EXCLUDED.preferred_windows,
      goals = EXCLUDED.goals,
      min_gym_min = EXCLUDED.min_gym_min,
      max_gym_min = EXCLUDED.max_gym_min,
      include_meal_prep = EXCLUDED.include_meal_prep,
      updated_at = NOW()
    `,
    [
      userId,
      gymFrequencyPerWeek,
      preferredWindows,
      goals,
      minGymMin,
      maxGymMin,
      includeMealPrep,
    ]
  );

  return getPrefs(userId);
}

async function getPrefs(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM schedule_prefs WHERE user_id = $1`,
    [userId]
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    userId: String(userId),
    gymFrequencyPerWeek: r.gym_frequency_per_week,
    preferredWindows: r.preferred_windows || [],
    goals: r.goals || [],
    minGymMin: r.min_gym_min,
    maxGymMin: r.max_gym_min,
    includeMealPrep: r.include_meal_prep,
  };
}

module.exports = {
  replaceEventsForUser,
  getEventsByUser,
  upsertPrefs,
  getPrefs,
};
