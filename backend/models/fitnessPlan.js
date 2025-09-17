const { pool } = require("../config/database");

class FitnessPlan {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.fitnessProfileId = row.fitness_profile_id;
    this.name = row.name;
    this.status = row.status;
    this.startDate = row.start_date;
    this.endDate = row.end_date;
    this.notes = row.notes;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  static async create({ userId, fitnessProfileId, name, status = 'active', startDate = null, endDate = null, notes = null }) {
    const r = await pool.query(
      `INSERT INTO fitness_plans
        (user_id, fitness_profile_id, name, status, start_date, end_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       // VALUES ($1,$2,$3,COALESCE($4,'active'),$5,$6,$7)
       RETURNING *`,
      [
        userId,
        fitnessProfileId,
        data.name,
        data.status || null,
        data.startDate || null,
        data.endDate || null,
        data.notes || null,
      ]
      [ userId, fitnessProfileId, name, status, startDate, endDate, notes ]
    );
    return new FitnessPlan(r.rows[0]);
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      fitnessProfileId: this.fitnessProfileId,
      name: this.name,
      status: this.status,
      startDate: this.startDate,
      endDate: this.endDate,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static async findById(id) {
    const r = await pool.query(`SELECT * FROM fitness_plans WHERE id=$1`, [id]);
    return r.rows[0] ? new FitnessPlan(r.rows[0]) : null;
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
      `SELECT * FROM fitness_plans WHERE ${where.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT ${Number(limit) | 0} OFFSET ${Number(offset) | 0}`,
      vals
    );
    return r.rows.map((row) => new FitnessPlan(row));
  }

  async update(patch) {
    const allowed = ["name", "status", "start_date", "end_date", "notes"];
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
      `UPDATE fitness_plans SET ${sets.join(
        ", "
      )}, updated_at=NOW() WHERE id=$${i} RETURNING *`,
      vals
    );
    Object.assign(this, new FitnessPlan(r.rows[0]));
    return this;
  }

  async delete() {
    await pool.query(`DELETE FROM fitness_plans WHERE id=$1`, [this.id]);
    return true;
  }
}

module.exports = FitnessPlan;
