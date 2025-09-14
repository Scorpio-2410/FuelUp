const { pool } = require("../config/database");

class MealPlan {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.name = row.name;
    this.status = row.status;
    this.startDate = row.start_date;
    this.endDate = row.end_date;
    this.targetCalories = row.target_calories;
    this.notes = row.notes;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  static async create(userId, data) {
    const r = await pool.query(
      `INSERT INTO meal_plans
        (user_id, name, status, start_date, end_date, target_calories, notes)
       VALUES ($1,$2,COALESCE($3,'active'),$4,$5,$6,$7)
       RETURNING *`,
      [
        userId,
        data.name,
        data.status || null,
        data.startDate || null,
        data.endDate || null,
        data.targetCalories || null,
        data.notes || null,
      ]
    );
    return new MealPlan(r.rows[0]);
  }

  static async findById(id) {
    const r = await pool.query(`SELECT * FROM meal_plans WHERE id=$1`, [id]);
    return r.rows[0] ? new MealPlan(r.rows[0]) : null;
  }

  static async listForUser(userId, { status, limit = 50, offset = 0 } = {}) {
    const where = ["user_id=$1"];
    const vals = [userId];
    let i = 2;
    if (status) {
      where.push("status=$" + i);
      vals.push(status);
      i++;
    }
    const r = await pool.query(
      `SELECT * FROM meal_plans WHERE ${where.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT ${Number(limit) | 0} OFFSET ${Number(offset) | 0}`,
      vals
    );
    return r.rows.map((row) => new MealPlan(row));
  }

  async update(patch) {
    const allowed = [
      "name",
      "status",
      "start_date",
      "end_date",
      "target_calories",
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
      `UPDATE meal_plans SET ${sets.join(
        ", "
      )}, updated_at=NOW() WHERE id=$${i} RETURNING *`,
      vals
    );
    Object.assign(this, new MealPlan(r.rows[0]));
    return this;
  }

  async delete() {
    await pool.query(`DELETE FROM meal_plans WHERE id=$1`, [this.id]);
    return true;
  }
}

module.exports = MealPlan;
