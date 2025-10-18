// backend/models/fitnessActivity.js
const { pool } = require("../config/database");

class FitnessActivity {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.date = row.date;
    this.activityType = row.activity_type;
    this.exerciseName = row.exercise_name;
    this.durationMinutes = row.duration_minutes;
    this.caloriesBurned = row.calories_burned;
    this.intensity = row.intensity;
    this.notes = row.notes;
    this.externalId = row.external_id;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  // Create a new fitness activity
  static async create(data) {
    const r = await pool.query(
      `INSERT INTO fitness_activities 
       (user_id, date, activity_type, exercise_name, duration_minutes, calories_burned, intensity, notes, external_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.userId,
        data.date,
        data.activityType,
        data.exerciseName,
        data.durationMinutes,
        data.caloriesBurned,
        data.intensity || 'moderate',
        data.notes || null,
        data.externalId || null,
      ]
    );
    return new FitnessActivity(r.rows[0]);
  }

  // Get activities for a user on a specific date
  static async findByUserAndDate(userId, date) {
    const r = await pool.query(
      `SELECT * FROM fitness_activities 
       WHERE user_id = $1 AND date = $2
       ORDER BY created_at DESC`,
      [userId, date]
    );
    return r.rows.map((row) => new FitnessActivity(row));
  }

  // Get activities for a user within a date range
  static async findByUserAndDateRange(userId, startDate, endDate) {
    const r = await pool.query(
      `SELECT * FROM fitness_activities 
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date DESC, created_at DESC`,
      [userId, startDate, endDate]
    );
    return r.rows.map((row) => new FitnessActivity(row));
  }

  // Get total calories burned from activities for a specific date
  static async getTotalCaloriesBurned(userId, date) {
    const r = await pool.query(
      `SELECT COALESCE(SUM(calories_burned), 0) as total_calories
       FROM fitness_activities 
       WHERE user_id = $1 AND date = $2`,
      [userId, date]
    );
    return parseInt(r.rows[0].total_calories) || 0;
  }

  // Get total calories burned from activities within a date range
  static async getTotalCaloriesBurnedRange(userId, startDate, endDate) {
    const r = await pool.query(
      `SELECT COALESCE(SUM(calories_burned), 0) as total_calories
       FROM fitness_activities 
       WHERE user_id = $1 AND date >= $2 AND date <= $3`,
      [userId, startDate, endDate]
    );
    return parseInt(r.rows[0].total_calories) || 0;
  }

  // Get activity statistics for a user over a period
  static async getStats(userId, startDate, endDate) {
    const r = await pool.query(
      `SELECT 
        COUNT(*) as total_activities,
        SUM(calories_burned) as total_calories,
        AVG(calories_burned) as avg_calories_per_activity,
        SUM(duration_minutes) as total_duration_minutes,
        AVG(duration_minutes) as avg_duration_minutes,
        activity_type,
        COUNT(*) as activity_count
       FROM fitness_activities
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       GROUP BY activity_type
       ORDER BY activity_count DESC`,
      [userId, startDate, endDate]
    );
    
    const overallStats = await pool.query(
      `SELECT 
        COUNT(*) as total_activities,
        SUM(calories_burned) as total_calories,
        AVG(calories_burned) as avg_calories_per_activity,
        SUM(duration_minutes) as total_duration_minutes,
        AVG(duration_minutes) as avg_duration_minutes
       FROM fitness_activities
       WHERE user_id = $1 AND date >= $2 AND date <= $3`,
      [userId, startDate, endDate]
    );

    return {
      overall: {
        totalActivities: parseInt(overallStats.rows[0].total_activities) || 0,
        totalCalories: parseInt(overallStats.rows[0].total_calories) || 0,
        avgCaloriesPerActivity: parseFloat(overallStats.rows[0].avg_calories_per_activity) || 0,
        totalDurationMinutes: parseInt(overallStats.rows[0].total_duration_minutes) || 0,
        avgDurationMinutes: parseFloat(overallStats.rows[0].avg_duration_minutes) || 0,
      },
      byType: r.rows.map((row) => ({
        activityType: row.activity_type,
        count: parseInt(row.activity_count),
        totalCalories: parseInt(row.total_calories) || 0,
        avgCalories: parseFloat(row.avg_calories_per_activity) || 0,
        totalDuration: parseInt(row.total_duration_minutes) || 0,
        avgDuration: parseFloat(row.avg_duration_minutes) || 0,
      }))
    };
  }

  // Update an existing activity
  async update(patch) {
    const allowed = ["activity_type", "exercise_name", "duration_minutes", "calories_burned", "intensity", "notes"];
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
      `UPDATE fitness_activities SET ${sets.join(", ")}, updated_at=NOW() WHERE id=$${i} RETURNING *`,
      vals
    );
    Object.assign(this, new FitnessActivity(r.rows[0]));
    return this;
  }

  // Delete an activity
  async delete() {
    await pool.query(`DELETE FROM fitness_activities WHERE id=$1`, [this.id]);
    return true;
  }

  // Delete by user and date
  static async deleteByUserAndDate(userId, date) {
    await pool.query(`DELETE FROM fitness_activities WHERE user_id=$1 AND date=$2`, [
      userId,
      date,
    ]);
    return true;
  }
}

module.exports = FitnessActivity;
