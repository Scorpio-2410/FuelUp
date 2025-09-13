// models/Nutrition.js
const { pool } = require("../config/database");

/**
 * Stores one row per user with nutrition targets (calories + optional macros).
 * Table: nutrition_targets
 */
class Nutrition {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.dailyCalorieTarget = row.daily_calorie_target;
    this.macros = row.macros || null; // JSONB, e.g. { protein: 140, carbs: 220, fat: 70 }
    this.updatedAt = row.updated_at;
  }

  // Read by user
  static async findByUserId(userId) {
    const r = await pool.query(
      "SELECT * FROM nutrition_targets WHERE user_id=$1",
      [userId]
    );
    return r.rows[0] ? new Nutrition(r.rows[0]) : null;
  }

  // Upsert by user
  static async upsert(userId, data) {
    const q = `
      INSERT INTO nutrition_targets (user_id, daily_calorie_target, macros)
      VALUES ($1,$2,$3)
      ON CONFLICT (user_id) DO UPDATE SET
        daily_calorie_target = EXCLUDED.daily_calorie_target,
        macros = EXCLUDED.macros,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const v = [
      userId,
      data.dailyCalorieTarget == null ? null : Number(data.dailyCalorieTarget),
      data.macros ? JSON.stringify(data.macros) : null,
    ];
    const r = await pool.query(q, v);
    return new Nutrition(r.rows[0]);
  }

  // Patch existing
  async update(patch) {
    const sets = [];
    const vals = [];
    let i = 1;

    if (Object.prototype.hasOwnProperty.call(patch, "daily_calorie_target")) {
      sets.push(`daily_calorie_target=$${i}`);
      vals.push(
        patch.daily_calorie_target == null
          ? null
          : Number(patch.daily_calorie_target)
      );
      i++;
    }

    if (Object.prototype.hasOwnProperty.call(patch, "macros")) {
      sets.push(`macros=$${i}`);
      vals.push(patch.macros ? JSON.stringify(patch.macros) : null);
      i++;
    }

    if (!sets.length) throw new Error("No valid fields to update");

    vals.push(this.userId);
    const sql = `
      UPDATE nutrition_targets
      SET ${sets.join(", ")}, updated_at=CURRENT_TIMESTAMP
      WHERE user_id=$${i}
      RETURNING *;`;
    const r = await pool.query(sql, vals);
    Object.assign(this, new Nutrition(r.rows[0]));
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      dailyCalorieTarget: this.dailyCalorieTarget,
      macros: this.macros,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Nutrition;
