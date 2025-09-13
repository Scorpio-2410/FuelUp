const { pool } = require("../config/database");

class Schedule {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.timezone = row.timezone;
    this.preferences =
      typeof row.preferences === "string"
        ? JSON.parse(row.preferences)
        : row.preferences || null;
    this.updatedAt = row.updated_at;
  }

  static async getOrCreate(userId) {
    const r = await pool.query(`SELECT * FROM schedules WHERE user_id=$1`, [
      userId,
    ]);
    if (r.rows[0]) return new Schedule(r.rows[0]);

    const ins = await pool.query(
      `INSERT INTO schedules (user_id) VALUES ($1) RETURNING *`,
      [userId]
    );
    return new Schedule(ins.rows[0]);
  }

  static async findByUserId(userId) {
    const r = await pool.query(`SELECT * FROM schedules WHERE user_id=$1`, [
      userId,
    ]);
    return r.rows[0] ? new Schedule(r.rows[0]) : null;
  }

  async update(patch) {
    const allowed = ["timezone", "preferences"];
    const sets = [];
    const vals = [];
    let i = 1;

    for (const col of allowed) {
      if (Object.prototype.hasOwnProperty.call(patch, col)) {
        const v =
          col === "preferences" && patch[col] && typeof patch[col] !== "string"
            ? JSON.stringify(patch[col])
            : patch[col];
        sets.push(`${col}=$${i}`);
        vals.push(v);
        i++;
      }
    }
    if (!sets.length) throw new Error("No valid fields to update");

    vals.push(this.id);
    const r = await pool.query(
      `UPDATE schedules SET ${sets.join(
        ", "
      )}, updated_at=NOW() WHERE id=$${i} RETURNING *`,
      vals
    );
    Object.assign(this, new Schedule(r.rows[0]));
    return this;
  }
}

module.exports = Schedule;
