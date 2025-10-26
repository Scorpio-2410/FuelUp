// models/nutritionProfile.js
const { pool } = require("../config/database");

class NutritionProfile {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.dailyCalorieTarget = row.daily_calorie_target;
    this.macros =
      typeof row.macros === "string"
        ? JSON.parse(row.macros)
        : row.macros || null;
    this.prefCuisines = row.pref_cuisines;
    this.dietRestrictions = row.diet_restrictions;
    this.updatedAt = row.updated_at;
  }

  static async upsert(userId, data = {}) {
    const r = await pool.query(
      `
      INSERT INTO nutrition_profiles
        (user_id, daily_calorie_target, macros, pref_cuisines, diet_restrictions)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (user_id) DO UPDATE SET
        daily_calorie_target = COALESCE(EXCLUDED.daily_calorie_target, nutrition_profiles.daily_calorie_target),
        macros             = COALESCE(EXCLUDED.macros, nutrition_profiles.macros),
        pref_cuisines      = COALESCE(EXCLUDED.pref_cuisines, nutrition_profiles.pref_cuisines),
        diet_restrictions  = COALESCE(EXCLUDED.diet_restrictions, nutrition_profiles.diet_restrictions),
        updated_at = NOW()
      RETURNING *`,
      [
        userId,
        data.dailyCalorieTarget ?? null,
        data.macros ? JSON.stringify(data.macros) : null,
        data.prefCuisines ?? null,
        data.dietRestrictions ?? null,
      ]
    );
    return new NutritionProfile(r.rows[0]);
  }

  static async findByUserId(userId) {
    const r = await pool.query(
      `SELECT * FROM nutrition_profiles WHERE user_id=$1`,
      [userId]
    );
    return r.rows[0] ? new NutritionProfile(r.rows[0]) : null;
  }

  async update(patch) {
    const allowed = [
      "daily_calorie_target",
      "macros",
      "pref_cuisines",
      "diet_restrictions",
    ];

    const sets = [];
    const vals = [];
    let i = 1;

    for (const col of allowed) {
      if (Object.prototype.hasOwnProperty.call(patch, col)) {
        const v =
          col === "macros" && patch[col] && typeof patch[col] !== "string"
            ? JSON.stringify(patch[col])
            : patch[col];
        sets.push(`${col}=$${i}`);
        vals.push(v);
        i++;
      }
    }

    if (!sets.length) throw new Error("No valid fields to update");
    vals.push(this.userId);

    const r = await pool.query(
      `UPDATE nutrition_profiles SET ${sets.join(", ")}, updated_at=NOW()
       WHERE user_id=$${i} RETURNING *`,
      vals
    );
    Object.assign(this, new NutritionProfile(r.rows[0]));
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      dailyCalorieTarget: this.dailyCalorieTarget,
      macros: this.macros,
      prefCuisines: this.prefCuisines,
      dietRestrictions: this.dietRestrictions,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = NutritionProfile;
