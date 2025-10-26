// backend/models/workoutSession.js
const { pool } = require("../config/database");

class WorkoutSession {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id ?? row.userId;
    this.workoutName = row.workout_name ?? row.workoutName;
    this.planId = row.plan_id ?? row.planId;
    this.eventId = row.event_id ?? row.eventId;
    this.durationSeconds = row.duration_seconds ?? row.durationSeconds;
    this.completedAt = row.completed_at ?? row.completedAt;
    this.exercisesCompleted = row.exercises_completed ?? row.exercisesCompleted;
    this.totalExercises = row.total_exercises ?? row.totalExercises;
    this.notes = row.notes;
    this.createdAt = row.created_at ?? row.createdAt;
  }

  static async create(data) {
    const completedAtIso = data.completedAt || new Date().toISOString();
    const completedAtDate = new Date(completedAtIso);
    const dateOnly = `${completedAtDate.getUTCFullYear()}-${String(
      completedAtDate.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(completedAtDate.getUTCDate()).padStart(
      2,
      "0"
    )}`;

    const r = await pool.query(
      `INSERT INTO workout_sessions
        (user_id, workout_name, plan_id, event_id, duration_seconds, completed_at, date, exercises_completed, total_exercises, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.userId,
        data.workoutName,
        data.planId || null,
        data.eventId || null,
        data.durationSeconds,
        completedAtIso,
        dateOnly,
        data.exercisesCompleted || 0,
        data.totalExercises || 0,
        data.notes || null,
      ]
    );
    return new WorkoutSession(r.rows[0]);
  }

  static async findById(id) {
    const r = await pool.query(`SELECT * FROM workout_sessions WHERE id=$1`, [
      id,
    ]);
    return r.rows[0] ? new WorkoutSession(r.rows[0]) : null;
  }

  static async findByUserId(userId, { limit = 50, offset = 0 } = {}) {
    const r = await pool.query(
      `SELECT * FROM workout_sessions 
       WHERE user_id=$1 
       ORDER BY completed_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return r.rows.map((row) => new WorkoutSession(row));
  }

  static async getStreak(userId) {
    // Get consecutive days of workouts
    const r = await pool.query(
      `WITH daily_workouts AS (
        SELECT DISTINCT DATE(completed_at) as workout_date
        FROM workout_sessions
        WHERE user_id = $1
        ORDER BY workout_date DESC
      ),
      date_diffs AS (
        SELECT 
          workout_date,
          workout_date - LAG(workout_date, 1) OVER (ORDER BY workout_date DESC) as diff
        FROM daily_workouts
      )
      SELECT COUNT(*) as streak
      FROM date_diffs
      WHERE diff IS NULL OR diff = -1`,
      [userId]
    );
    return r.rows[0]?.streak || 0;
  }

  static async getTotalWorkouts(userId) {
    const r = await pool.query(
      `SELECT COUNT(*) as total FROM workout_sessions WHERE user_id=$1`,
      [userId]
    );
    return parseInt(r.rows[0]?.total || 0);
  }

  static async getWorkoutsByDateRange(userId, fromDate, toDate) {
    const r = await pool.query(
      `SELECT * FROM workout_sessions 
       WHERE user_id=$1 
       AND completed_at >= $2 
       AND completed_at < $3
       ORDER BY completed_at DESC`,
      [userId, fromDate, toDate]
    );
    return r.rows.map((row) => new WorkoutSession(row));
  }

  async update(patch) {
    const allowed = [
      "workout_name",
      "duration_seconds",
      "exercises_completed",
      "total_exercises",
      "notes",
    ];

    const sets = [];
    const vals = [];
    let i = 1;

    for (const col of allowed) {
      if (Object.prototype.hasOwnProperty.call(patch, col)) {
        sets.push(`${col}=$${i}`);
        vals.push(patch[col]);
        i++;
      }
    }
    if (!sets.length) throw new Error("No valid fields to update");

    vals.push(this.id);
    const r = await pool.query(
      `UPDATE workout_sessions SET ${sets.join(
        ", "
      )} WHERE id=$${i} RETURNING *`,
      vals
    );
    Object.assign(this, new WorkoutSession(r.rows[0]));
    return this;
  }

  async delete() {
    await pool.query(`DELETE FROM workout_sessions WHERE id=$1`, [this.id]);
    return true;
  }
}

module.exports = WorkoutSession;
