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
  // Counts consecutive days from today backwards where step_count >= 8000
  static async getCurrentStreak(userId) {
    try {
      // Get all step records for this user, ordered by date descending
      const r = await pool.query(
        `SELECT date, step_count
         FROM step_streaks
         WHERE user_id = $1 AND step_count >= 8000
         ORDER BY date DESC
         LIMIT 365`,
        [userId]
      );

      if (r.rows.length === 0) {
        return 0; // No records, no streak
      }

      // Check consecutive days from today backwards
      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      let checkDate = new Date(today);

      for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasSteps = r.rows.some(row => {
          const rowDate = new Date(row.date).toISOString().split('T')[0];
          return rowDate === dateStr;
        });

        if (hasSteps) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1); // Go back one day
        } else {
          break; // Streak broken
        }
      }

      return streak;
    } catch (error) {
      console.error('getCurrentStreak error:', error);
      return 0; // Return 0 on error instead of throwing
    }
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

