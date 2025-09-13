// models/Schedule.js
const { pool } = require("../config/database");

class ScheduleEvent {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.title = row.title;
    this.description = row.description;
    this.date = row.date; // DATE (plain calendar date)
    this.startTime = row.start_time; // TIME (nullable)
    this.endTime = row.end_time; // TIME (nullable)
    this.location = row.location;
    this.isAllDay = row.is_all_day;
    this.recurrenceRule = row.recurrence_rule; // e.g., RRULE string (nullable)
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  static async create(data) {
    const sql = `
      INSERT INTO schedule_events
        (user_id, title, description, date, start_time, end_time, location, is_all_day, recurrence_rule)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,COALESCE($8,false),$9)
      RETURNING *`;
    const vals = [
      data.userId,
      data.title,
      data.description || null,
      data.date, // YYYY-MM-DD
      data.startTime || null, // HH:MM or HH:MM:SS
      data.endTime || null,
      data.location || null,
      data.isAllDay,
      data.recurrenceRule || null,
    ];
    const r = await pool.query(sql, vals);
    return new ScheduleEvent(r.rows[0]);
  }

  static async findById(id) {
    const r = await pool.query("SELECT * FROM schedule_events WHERE id=$1", [
      id,
    ]);
    return r.rows[0] ? new ScheduleEvent(r.rows[0]) : null;
  }

  static async findByUserAndDate(userId, date) {
    const r = await pool.query(
      `SELECT * FROM schedule_events
       WHERE user_id=$1 AND date=$2
       ORDER BY is_all_day DESC, start_time NULLS FIRST, id ASC`,
      [userId, date]
    );
    return r.rows.map((row) => new ScheduleEvent(row));
  }

  static async findByUserAndRange(userId, startDate, endDate) {
    const r = await pool.query(
      `SELECT * FROM schedule_events
       WHERE user_id=$1 AND date BETWEEN $2 AND $3
       ORDER BY date ASC, is_all_day DESC, start_time NULLS FIRST, id ASC`,
      [userId, startDate, endDate]
    );
    return r.rows.map((row) => new ScheduleEvent(row));
  }

  async update(patch) {
    const allowed = [
      "title",
      "description",
      "date",
      "start_time",
      "end_time",
      "location",
      "is_all_day",
      "recurrence_rule",
    ];

    const casts = {
      date: "::date",
      start_time: "::time",
      end_time: "::time",
    };

    const sets = [];
    const vals = [];
    let i = 1;

    for (const col of allowed) {
      if (Object.prototype.hasOwnProperty.call(patch, col)) {
        const cast = casts[col] || "";
        sets.push(`${col}=$${i}${cast}`);
        vals.push(patch[col]);
        i++;
      }
    }

    if (!sets.length) throw new Error("No valid fields to update");

    vals.push(this.id);
    const sql = `UPDATE schedule_events
                 SET ${sets.join(", ")}, updated_at=CURRENT_TIMESTAMP
                 WHERE id=$${i}
                 RETURNING *`;
    const r = await pool.query(sql, vals);
    if (!r.rows[0]) throw new Error("Event not found after update");
    Object.assign(this, new ScheduleEvent(r.rows[0]));
    return this;
  }

  async delete() {
    await pool.query("DELETE FROM schedule_events WHERE id=$1", [this.id]);
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      description: this.description,
      date: this.date, // "YYYY-MM-DD"
      startTime: this.startTime, // "HH:MM:SS" (or null)
      endTime: this.endTime, // "HH:MM:SS" (or null)
      location: this.location,
      isAllDay: this.isAllDay,
      recurrenceRule: this.recurrenceRule,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = ScheduleEvent;
