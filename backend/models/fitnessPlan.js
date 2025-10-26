const { pool } = require("../config/database");

class FitnessPlan {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.name = row.name;
    this.status = row.status;
    this.notes = row.notes ?? null;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      status: this.status,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /* ---------- Static ---------- */

  static async create(userId, { name, status = "active", notes = null }) {
    const { rows } = await pool.query(
      `INSERT INTO fitness_plans (user_id, name, status, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, name, status, notes, created_at, updated_at`,
      [userId, name, status, notes]
    );
    return new FitnessPlan(rows[0]);
  }

  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, user_id, name, status, notes, created_at, updated_at
         FROM fitness_plans
        WHERE id = $1
        LIMIT 1`,
      [id]
    );
    return rows[0] ? new FitnessPlan(rows[0]) : null;
  }

  static async listForUser(userId, { status, limit = 50, offset = 0 } = {}) {
    const params = [userId];
    let where = "WHERE user_id = $1";
    if (status) {
      params.push(status);
      where += ` AND status = $${params.length}`;
    }
    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT id, user_id, name, status, notes, created_at, updated_at
         FROM fitness_plans
         ${where}
        ORDER BY created_at DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return rows.map((r) => new FitnessPlan(r));
  }

  /* ---------- Instance ---------- */

  async update(patch) {
    if (!patch || Object.keys(patch).length === 0) return this;

    const cols = [];
    const vals = [];
    let i = 1;

    for (const [col, val] of Object.entries(patch)) {
      // whitelist only the columns that exist now
      if (!["name", "status", "notes"].includes(col)) continue;
      cols.push(`${col} = $${i++}`);
      vals.push(val);
    }

    if (cols.length === 0) return this;

    // add id for WHERE
    vals.push(this.id);

    const { rows } = await pool.query(
      `UPDATE fitness_plans
          SET ${cols.join(", ")}, updated_at = NOW()
        WHERE id = $${vals.length}
        RETURNING id, user_id, name, status, notes, created_at, updated_at`,
      vals
    );

    const row = rows[0];
    this.name = row.name;
    this.status = row.status;
    this.notes = row.notes ?? null;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
    return this;
  }

  async delete() {
    await pool.query(`DELETE FROM fitness_plans WHERE id=$1`, [this.id]);
  }
}

module.exports = FitnessPlan;