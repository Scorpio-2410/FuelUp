const { pool } = require("../config/database");

const MEAL_TYPES = new Set(["breakfast", "lunch", "dinner", "snack", "other"]);

class Meal {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.mealPlanId = row.meal_plan_id;
    this.loggedAt = row.logged_at;
    this.name = row.name;
    this.mealType = row.meal_type;
    this.calories = row.calories;
    this.proteinG = row.protein_g;
    this.carbsG = row.carbs_g;
    this.fatG = row.fat_g;
    this.notes = row.notes;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  static validateType(t) {
    return MEAL_TYPES.has(t);
  }

  static async create(data) {
    if (data.mealType && !Meal.validateType(data.mealType)) {
      throw new Error("Invalid meal type");
    }
    const r = await pool.query(
      `INSERT INTO meals
        (user_id, meal_plan_id, logged_at, name, meal_type, calories, protein_g, carbs_g, fat_g, notes)
       VALUES ($1,$2,COALESCE($3,NOW()),$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        data.userId,
        data.mealPlanId || null,
        data.loggedAt || null,
        data.name || null,
        data.mealType || null,
        data.calories || null,
        data.proteinG || null,
        data.carbsG || null,
        data.fatG || null,
        data.notes || null,
      ]
    );
    return new Meal(r.rows[0]);
  }

  static async findById(id) {
    const r = await pool.query(`SELECT * FROM meals WHERE id=$1`, [id]);
    return r.rows[0] ? new Meal(r.rows[0]) : null;
  }

  static async findByUserId(userId, limit = 20, offset = 0) {
    const r = await pool.query(
      `SELECT * FROM meals WHERE user_id=$1 ORDER BY logged_at DESC
       LIMIT ${Number(limit) | 0} OFFSET ${Number(offset) | 0}`,
      [userId]
    );
    return r.rows.map((row) => new Meal(row));
  }

  static async findByUserAndDate(userId, date) {
    const r = await pool.query(
      `SELECT * FROM meals
       WHERE user_id=$1 AND DATE(logged_at) = $2::date
       ORDER BY logged_at ASC`,
      [userId, date]
    );
    return r.rows.map((row) => new Meal(row));
  }

  static async findByDateRange(userId, startDate, endDate) {
    const r = await pool.query(
      `SELECT * FROM meals
       WHERE user_id=$1 AND DATE(logged_at) BETWEEN $2::date AND $3::date
       ORDER BY logged_at ASC`,
      [userId, startDate, endDate]
    );
    return r.rows.map((row) => new Meal(row));
  }

  static async getDailyNutritionSummary(userId, date) {
    const r = await pool.query(
      `SELECT
         COALESCE(SUM(calories),0) AS calories,
         COALESCE(SUM(protein_g),0) AS protein_g,
         COALESCE(SUM(carbs_g),0)   AS carbs_g,
         COALESCE(SUM(fat_g),0)     AS fat_g
       FROM meals
       WHERE user_id=$1 AND DATE(logged_at) = $2::date`,
      [userId, date]
    );
    return r.rows[0];
  }

  static async getMealsByTypeAndDate(userId, date) {
    const r = await pool.query(
      `SELECT meal_type, json_agg(m ORDER BY logged_at) AS meals
       FROM (
         SELECT * FROM meals
         WHERE user_id=$1 AND DATE(logged_at) = $2::date
       ) AS m
       GROUP BY meal_type`,
      [userId, date]
    );
    const byType = {};
    for (const row of r.rows) {
      byType[row.meal_type || "unspecified"] = row.meals.map(
        (m) => new Meal(m)
      );
    }
    return byType;
  }

  getMacroPercentages() {
    const cal = this.calories || 0;
    if (!cal) return { protein: 0, carbs: 0, fat: 0 };
    // 4 kcal/g for protein & carbs, 9 kcal/g for fat
    const pCal = (this.proteinG || 0) * 4;
    const cCal = (this.carbsG || 0) * 4;
    const fCal = (this.fatG || 0) * 9;
    const total = pCal + cCal + fCal || 1;
    return {
      protein: +((pCal / total) * 100).toFixed(1),
      carbs: +((cCal / total) * 100).toFixed(1),
      fat: +((fCal / total) * 100).toFixed(1),
    };
  }

  async update(patch) {
    if (patch.meal_type && !Meal.validateType(patch.meal_type)) {
      throw new Error("Invalid meal type");
    }
    const allowed = [
      "meal_plan_id",
      "logged_at",
      "name",
      "meal_type",
      "calories",
      "protein_g",
      "carbs_g",
      "fat_g",
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
      `UPDATE meals SET ${sets.join(
        ", "
      )}, updated_at=NOW() WHERE id=$${i} RETURNING *`,
      vals
    );
    Object.assign(this, new Meal(r.rows[0]));
    return this;
  }

  async delete() {
    await pool.query(`DELETE FROM meals WHERE id=$1`, [this.id]);
    return true;
  }
}

module.exports = Meal;
