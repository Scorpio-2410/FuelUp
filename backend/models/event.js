// backend/models/event.js
const { pool } = require("../config/database");

const CATS = new Set(["meal", "workout", "work", "other"]);
const RECUR = new Set(["none", "daily", "weekly", "weekday"]);

class Event {
  constructor(row) {
    // For non-expanded rows, row.id === db row id.
    // For expanded occurrences, we carry db_id and synthesize a UI-friendly id.
    this.id = row.id; // instance id (can be pseudo for expansions)
    this.dbId = row.db_id ?? row.dbId ?? row.id; // ALWAYS the real DB row id

    this.scheduleId = row.schedule_id ?? row.scheduleId;
    this.category = row.category;
    this.title = row.title;
    this.startAt = row.start_at ?? row.startAt;
    this.endAt = row.end_at ?? row.endAt;
    this.notes = row.notes;
    this.recurrenceRule = row.recurrence_rule || row.recurrenceRule || "none";
    this.recurrenceUntil = row.recurrence_until || row.recurrenceUntil || null;
    this.createdAt = row.created_at ?? row.createdAt;
    this.updatedAt = row.updated_at ?? row.updatedAt;
  }

  static validateCategory(cat) {
    return CATS.has(cat);
  }
  static validateRecurrence(rule) {
    return !rule || RECUR.has(rule);
  }

  static async create(data) {
    const category = String(data.category || "")
      .toLowerCase()
      .trim();
    if (!Event.validateCategory(category)) throw new Error("Invalid category");
    if (!Event.validateRecurrence(data.recurrence_rule))
      throw new Error("Invalid recurrence");

    const r = await pool.query(
      `INSERT INTO events
        (schedule_id, category, title, start_at, end_at, notes, recurrence_rule, recurrence_until)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        data.scheduleId,
        category,
        data.title,
        data.startAt,
        data.endAt || null,
        data.notes || null,
        data.recurrence_rule || "none",
        data.recurrence_until || null,
      ]
    );
    return new Event(r.rows[0]);
  }

  static async findById(id) {
    const r = await pool.query(`SELECT * FROM events WHERE id=$1`, [id]);
    return r.rows[0] ? new Event(r.rows[0]) : null;
  }

  static async _rowsForSchedule(
    scheduleId,
    { from, to, limit = 500, offset = 0 } = {}
  ) {
    const where = ["schedule_id=$1"];
    const vals = [scheduleId];
    let i = 2;
    if (from) {
      // include recurring series even if base start_at is outside window
      where.push(`(start_at >= $${i} OR recurrence_rule <> 'none')`);
      vals.push(from);
      i++;
    }
    if (to) {
      where.push(`(start_at < $${i} OR recurrence_rule <> 'none')`);
      vals.push(to);
      i++;
    }
    const r = await pool.query(
      `SELECT * FROM events WHERE ${where.join(" AND ")}
       ORDER BY start_at ASC
       LIMIT ${Number(limit) | 0} OFFSET ${Number(offset) | 0}`,
      vals
    );
    return r.rows.map((row) => new Event(row));
  }

  /** Expand recurrence inside a requested time window. */
  static async listForSchedule(scheduleId, { from, to } = {}) {
    const rows = await Event._rowsForSchedule(scheduleId, { from, to });
    if (!from && !to) return rows;

    const start = from ? new Date(from) : new Date(0);
    const end = to ? new Date(to) : new Date("9999-12-31");

    const out = [];
    for (const e of rows) {
      const baseStart = new Date(e.startAt);
      const baseEnd = e.endAt ? new Date(e.endAt) : null;

      const pushIfInWindow = (s, eEnd) => {
        if ((eEnd || s) >= start && s < end) {
          // IMPORTANT: pass explicit snake_case fields and ownership info
          const clone = new Event({
            id: e.id,
            db_id: e.dbId ?? e.id, // real DB id for mutations
            schedule_id: e.scheduleId, // preserve schedule ownership
            category: e.category,
            title: e.title,
            start_at: new Date(s),
            end_at: eEnd ? new Date(eEnd) : null,
            notes: e.notes,
            recurrence_rule: e.recurrenceRule || "none",
            recurrence_until: e.recurrenceUntil || null,
            created_at: e.createdAt,
            updated_at: e.updatedAt,
          });
          // synthesize a stable UI id for this occurrence; keep dbId for mutations
          clone.id = Number(`${clone.dbId}${s.getTime().toString().slice(-6)}`);
          out.push(clone);
        }
      };

      if (e.recurrenceRule === "none") {
        pushIfInWindow(baseStart, baseEnd);
        continue;
      }

      const until = e.recurrenceUntil
        ? new Date(e.recurrenceUntil)
        : new Date(end);

      let cursor = new Date(baseStart);
      let cursorEnd = baseEnd ? new Date(baseEnd) : null;

      if (e.recurrenceRule === "daily") {
        while (cursor <= end && cursor <= until) {
          pushIfInWindow(cursor, cursorEnd);
          cursor.setDate(cursor.getDate() + 1);
          if (cursorEnd) cursorEnd.setDate(cursorEnd.getDate() + 1);
        }
      } else if (e.recurrenceRule === "weekly") {
        while (cursor <= end && cursor <= until) {
          pushIfInWindow(cursor, cursorEnd);
          cursor.setDate(cursor.getDate() + 7);
          if (cursorEnd) cursorEnd.setDate(cursorEnd.getDate() + 7);
        }
      } else if (e.recurrenceRule === "weekday") {
        // Mon–Fri in UTC (0=Sun..6=Sat)
        while (cursor <= end && cursor <= until) {
          const dow = cursor.getUTCDay();
          if (dow >= 1 && dow <= 5) pushIfInWindow(cursor, cursorEnd);
          cursor.setDate(cursor.getDate() + 1);
          if (cursorEnd) cursorEnd.setDate(cursorEnd.getDate() + 1);
        }
      }
    }

    out.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    return out;
  }

  async update(patch) {
    const allowed = [
      "category",
      "title",
      "start_at",
      "end_at",
      "notes",
      "recurrence_rule",
      "recurrence_until",
    ];

    const sets = [];
    const vals = [];
    let i = 1;

    if (patch.category) {
      patch.category = String(patch.category).toLowerCase().trim();
      if (!Event.validateCategory(patch.category))
        throw new Error("Invalid category");
    }
    if (
      patch.recurrence_rule &&
      !Event.validateRecurrence(patch.recurrence_rule)
    ) {
      throw new Error("Invalid recurrence");
    }

    for (const col of allowed) {
      if (Object.prototype.hasOwnProperty.call(patch, col)) {
        sets.push(`${col}=$${i}`);
        vals.push(patch[col]);
        i++;
      }
    }
    if (!sets.length) throw new Error("No valid fields to update");

    vals.push(Number(this.dbId ?? this.id)); // ensure we target the real DB row
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
    await pool.query(`DELETE FROM events WHERE id=$1`, [
      Number(this.dbId ?? this.id),
    ]);
    return true;
  }
}

module.exports = Event;
