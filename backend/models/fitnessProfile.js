// models/fitnessProfile.js
const { pool } = require("../config/database");

class FitnessProfile {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.heightCm = row.height_cm;
    this.weightKg = row.weight_kg;
    this.goal = row.goal;
    this.activityLevel = row.activity_level;
    this.daysPerWeek = row.days_per_week;
    this.updatedAt = row.updated_at;
  }

  static async upsert(userId, data = {}) {
    const r = await pool.query(
      `
      INSERT INTO fitness_profiles (
        user_id, height_cm, weight_kg, goal, activity_level, days_per_week
      )
      VALUES ($1,$2,$3,COALESCE($4,'general_health'),COALESCE($5,'moderate'),$6)
      ON CONFLICT (user_id) DO UPDATE SET
        height_cm        = COALESCE(EXCLUDED.height_cm, fitness_profiles.height_cm),
        weight_kg        = COALESCE(EXCLUDED.weight_kg, fitness_profiles.weight_kg),
        goal             = COALESCE(EXCLUDED.goal, fitness_profiles.goal),
        activity_level   = COALESCE(EXCLUDED.activity_level, fitness_profiles.activity_level),
        days_per_week    = COALESCE(EXCLUDED.days_per_week, fitness_profiles.days_per_week),
        updated_at = NOW()
      RETURNING *`,
      [
        userId,
        data.heightCm ?? null,
        data.weightKg ?? null,
        data.goal || null,
        data.activityLevel || null,
        data.daysPerWeek ?? null,
      ]
    );
    return new FitnessProfile(r.rows[0]);
  }

  static async findByUserId(userId) {
    const r = await pool.query(
      `SELECT * FROM fitness_profiles WHERE user_id=$1`,
      [userId]
    );
    return r.rows[0] ? new FitnessProfile(r.rows[0]) : null;
  }

  static async findById(id) {
    const r = await pool.query(`SELECT * FROM fitness_profiles WHERE id=$1`, [id]);
    return r.rows[0] ? new FitnessProfile(r.rows[0]) : null;
  }

  async update(patch) {
    const map = {
      heightCm: "height_cm",
      weightKg: "weight_kg",
      goal: "goal",
      activityLevel: "activity_level",
      daysPerWeek: "days_per_week",
    };

    const sets = [];
    const vals = [];
    let i = 1;

    for (const k of Object.keys(map)) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) {
        sets.push(`${map[k]}=$${i}`);
        vals.push(patch[k]);
        i++;
      }
    }

    if (!sets.length) throw new Error("No valid fields to update");
    vals.push(this.userId);

    const r = await pool.query(
      `UPDATE fitness_profiles SET ${sets.join(", ")}, updated_at=NOW()
       WHERE user_id=$${i} RETURNING *`,
      vals
    );
    Object.assign(this, new FitnessProfile(r.rows[0]));
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      heightCm: this.heightCm,
      weightKg: this.weightKg,
      goal: this.goal,
      activityLevel: this.activityLevel,
      daysPerWeek: this.daysPerWeek,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = FitnessProfile;
