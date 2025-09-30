// models/planExercise.js
const { pool } = require("../config/database");

class PlanExercise {
  constructor(row) {
    this.id = row.id;
    this.planId = row.plan_id;
    this.source = row.source;
    this.externalId = row.external_id;
    this.name = row.name;
    this.gifUrl = row.gif_url;
    this.bodyPart = row.body_part;
    this.target = row.target;
    this.equipment = row.equipment;
    this.addedAt = row.added_at;
  }

  static async addToPlan(planId, e) {
    const r = await pool.query(
      `INSERT INTO fitness_plan_exercises
         (plan_id, source, external_id, name, gif_url, body_part, target, equipment)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (plan_id, source, external_id) DO NOTHING
       RETURNING *`,
      [
        planId,
        "exercisedb",
        e.externalId,
        e.name,
        e.gifUrl || null,
        e.bodyPart || null,
        e.target || null,
        e.equipment || null,
      ]
    );
    return r.rows[0] ? new PlanExercise(r.rows[0]) : null; // null if already there
  }

  static async list(planId, { limit = 200, offset = 0 } = {}) {
    const r = await pool.query(
      `SELECT * FROM fitness_plan_exercises
       WHERE plan_id=$1
       ORDER BY added_at DESC
       LIMIT $2 OFFSET $3`,
      [planId, limit, offset]
    );
    return r.rows.map((row) => new PlanExercise(row));
  }

  static async remove(planId, externalId) {
    await pool.query(
      `DELETE FROM fitness_plan_exercises
       WHERE plan_id=$1 AND source='exercisedb' AND external_id=$2`,
      [planId, externalId]
    );
    return true;
  }
}

module.exports = PlanExercise;
