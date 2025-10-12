// backend/models/stepStreak.js
const { pool } = require("../config/database");

class StepStreak {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.date = row.date;
    this.stepCount = row.step_count;
    this.calories = row.calories;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  // Create or update a step record for a user on a specific date
  // SQL updates whenever you POST to /api/steps - can be multiple times per day
  static async upsert(data) {
    const r = await pool.query(
      `
      INSERT INTO step_streaks (user_id, date, step_count, calories)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        step_count = EXCLUDED.step_count,
        calories = EXCLUDED.calories,
        updated_at = NOW()
      RETURNING *`,
      [
        data.userId,
        data.date, // should be in YYYY-MM-DD format
        data.stepCount || 0,
        data.calories || null,
      ]
    );
    return new StepStreak(r.rows[0]);
  }

  // Find a specific step record by user and date
  static async findByUserAndDate(userId, date) {
    const r = await pool.query(
      `SELECT * FROM step_streaks WHERE user_id=$1 AND date=$2`,
      [userId, date]
    );
    return r.rows[0] ? new StepStreak(r.rows[0]) : null;
  }

  // Get all step records for a user within a date range
  static async findByUserAndDateRange(userId, startDate, endDate) {
    const r = await pool.query(
      `SELECT * FROM step_streaks 
       WHERE user_id=$1 AND date >= $2 AND date <= $3
       ORDER BY date ASC`,
      [userId, startDate, endDate]
    );
    return r.rows.map((row) => new StepStreak(row));
  }

  // Get step statistics for a user over a period
  static async getStats(userId, startDate, endDate) {
    const r = await pool.query(
      `SELECT 
        COUNT(*) as total_days,
        SUM(step_count) as total_steps,
        AVG(step_count) as avg_steps,
        MAX(step_count) as max_steps,
        MIN(step_count) as min_steps,
        SUM(calories) as total_calories,
        AVG(calories) as avg_calories
       FROM step_streaks
       WHERE user_id=$1 AND date >= $2 AND date <= $3`,
      [userId, startDate, endDate]
    );
    
    const stats = r.rows[0];
    return {
      totalDays: parseInt(stats.total_days) || 0,
      totalSteps: parseInt(stats.total_steps) || 0,
      avgSteps: parseFloat(stats.avg_steps) || 0,
      maxSteps: parseInt(stats.max_steps) || 0,
      minSteps: parseInt(stats.min_steps) || 0,
      totalCalories: parseInt(stats.total_calories) || 0,
      avgCalories: parseFloat(stats.avg_calories) || 0,
    };
  }

  // Get weekly stats - groups by week
  static async getWeeklyStats(userId, startDate, endDate) {
    const r = await pool.query(
      `SELECT 
        DATE_TRUNC('week', date) as week_start,
        COUNT(*) as days_logged,
        SUM(step_count) as total_steps,
        AVG(step_count) as avg_steps,
        MAX(step_count) as max_steps,
        SUM(calories) as total_calories
       FROM step_streaks
       WHERE user_id=$1 AND date >= $2 AND date <= $3
       GROUP BY DATE_TRUNC('week', date)
       ORDER BY week_start ASC`,
      [userId, startDate, endDate]
    );
    
    return r.rows.map((row) => ({
      weekStart: row.week_start,
      daysLogged: parseInt(row.days_logged),
      totalSteps: parseInt(row.total_steps) || 0,
      avgSteps: parseFloat(row.avg_steps) || 0,
      maxSteps: parseInt(row.max_steps) || 0,
      totalCalories: parseInt(row.total_calories) || 0,
    }));
  }

  // Get monthly stats - groups by month
  static async getMonthlyStats(userId, startDate, endDate) {
    const r = await pool.query(
      `SELECT 
        DATE_TRUNC('month', date) as month_start,
        COUNT(*) as days_logged,
        SUM(step_count) as total_steps,
        AVG(step_count) as avg_steps,
        MAX(step_count) as max_steps,
        SUM(calories) as total_calories
       FROM step_streaks
       WHERE user_id=$1 AND date >= $2 AND date <= $3
       GROUP BY DATE_TRUNC('month', date)
       ORDER BY month_start ASC`,
      [userId, startDate, endDate]
    );
    
    return r.rows.map((row) => ({
      monthStart: row.month_start,
      daysLogged: parseInt(row.days_logged),
      totalSteps: parseInt(row.total_steps) || 0,
      avgSteps: parseFloat(row.avg_steps) || 0,
      maxSteps: parseInt(row.max_steps) || 0,
      totalCalories: parseInt(row.total_calories) || 0,
    }));
  }

  // Calculate streak (consecutive days with steps logged)
  static async getCurrentStreak(userId) {
    const r = await pool.query(
      `WITH RECURSIVE date_series AS (
        -- Start from today going backwards
        SELECT 
          CURRENT_DATE as check_date,
          0 as days_back
        UNION ALL
        SELECT 
          check_date - INTERVAL '1 day',
          days_back + 1
        FROM date_series
        WHERE days_back < 365  -- limit to 1 year
      ),
      user_steps AS (
        SELECT DISTINCT date
        FROM step_streaks
        WHERE user_id = $1 AND step_count > 0
      )
      SELECT COUNT(*) as streak_days
      FROM date_series ds
      INNER JOIN user_steps us ON ds.check_date::date = us.date
      WHERE ds.check_date <= CURRENT_DATE
      ORDER BY ds.check_date DESC`,
      [userId]
    );
    
    return parseInt(r.rows[0]?.streak_days) || 0;
  }

  // Update an existing step record
  async update(patch) {
    const allowed = ["step_count", "calories"];
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
      `UPDATE step_streaks SET ${sets.join(
        ", "
      )}, updated_at=NOW() WHERE id=$${i} RETURNING *`,
      vals
    );
    Object.assign(this, new StepStreak(r.rows[0]));
    return this;
  }

  // Delete a step record
  async delete() {
    await pool.query(`DELETE FROM step_streaks WHERE id=$1`, [this.id]);
    return true;
  }

  // Delete by user and date
  static async deleteByUserAndDate(userId, date) {
    await pool.query(`DELETE FROM step_streaks WHERE user_id=$1 AND date=$2`, [
      userId,
      date,
    ]);
    return true;
  }
}

module.exports = StepStreak;

