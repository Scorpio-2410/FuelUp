const { pool } = require("../config/database");

const CATS = new Set(["meal", "workout", "other"]);

class Event {
  constructor(row) {
    this.id = row.id;
    this.scheduleId = row.schedule_id;
    this.category = row.category;
    this.title = row.title;
    this.startAt = row.start_at;
    this.endAt = row.end_at;
    this.location = row.location;
    this.notes = row.notes;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  static validateCategory(cat) {
    return CATS.has(cat);
  }

  static async create(data) {
    if (!Event.validateCategory(data.category)) {
      throw new Error("Invalid category");
    }
    const r = await pool.query(
      `INSERT INTO events
        (schedule_id, category, title, start_at, end_at, location, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        data.scheduleId,
        data.category,
        data.title,
        data.startAt,
        data.endAt || null,
        data.location || null,
        data.notes || null,
      ]
    );
    return new Event(r.rows[0]);
  }

  static async findById(id) {
    const r = await pool.query(`SELECT * FROM events WHERE id=$1`, [id]);
    return r.rows[0] ? new Event(r.rows[0]) : null;
  }

  static async listForSchedule(
    scheduleId,
    { from, to, limit = 100, offset = 0 } = {}
  ) {
    const where = ["schedule_id=$1"];
    const vals = [scheduleId];
    let i = 2;
    if (from) {
      where.push(`start_at >= $${i++}`);
      vals.push(from);
    }
    if (to) {
      where.push(`start_at < $${i++}`);
      vals.push(to);
    }

    const r = await pool.query(
      `SELECT * FROM events WHERE ${where.join(" AND ")}
       ORDER BY start_at ASC
       LIMIT ${Number(limit) | 0} OFFSET ${Number(offset) | 0}`,
      vals
    );
    return r.rows.map((row) => new Event(row));
  }

  async update(patch) {
    const allowed = [
      "category",
      "title",
      "start_at",
      "end_at",
      "location",
      "notes",
    ];
    const sets = [];
    const vals = [];
    let i = 1;

    if (patch.category && !Event.validateCategory(patch.category)) {
      throw new Error("Invalid category");
    }

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
      `UPDATE events SET ${sets.join(
        ", "
      )}, updated_at=NOW() WHERE id=$${i} RETURNING *`,
      vals
    );
    Object.assign(this, new Event(r.rows[0]));
    return this;
  }

  async delete() {
    await pool.query(`DELETE FROM events WHERE id=$1`, [this.id]);
    return true;
  }
}

module.exports = Event;
