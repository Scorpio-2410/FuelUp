const { pool } = require("../config/database");

class Exercise {
  constructor(row) {
    this.id = row.id;
    this.fitnessPlanId = row.fitness_plan_id;

    this.name = row.name;
    this.muscleGroup = row.muscle_group;
    this.equipment = row.equipment;
    this.difficulty = row.difficulty;

    this.durationMin = row.duration_min;
    this.sets = row.sets;
    this.reps = row.reps;
    this.restSeconds = row.rest_seconds;

    this.notes = row.notes;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  static async create(planId, data) {
    const r = await pool.query(
      `INSERT INTO exercises
        (fitness_plan_id, name, muscle_group, equipment, difficulty,
         duration_min, sets, reps, rest_seconds, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        planId,
        data.name,
        data.muscleGroup || null,
        data.equipment || null,
        data.difficulty || null,
        data.durationMin ?? null,
        data.sets ?? null,
        data.reps ?? null,
        data.restSeconds ?? null,
        data.notes || null,
      ]
    );
    return new Exercise(r.rows[0]);
  }

  static async listByPlan(planId) {
    const r = await pool.query(
      `SELECT * FROM exercises WHERE fitness_plan_id=$1 ORDER BY id ASC`,
      [planId]
    );
    return r.rows.map((row) => new Exercise(row));
  }

  static async findById(id) {
    const r = await pool.query(`SELECT * FROM exercises WHERE id=$1`, [id]);
    return r.rows[0] ? new Exercise(r.rows[0]) : null;
  }

  async update(patch) {
    const allowed = [
      "name",
      "muscle_group",
      "equipment",
      "difficulty",
      "duration_min",
      "sets",
      "reps",
      "rest_seconds",
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
      `UPDATE exercises SET ${sets.join(
        ", "
      )}, updated_at=NOW() WHERE id=$${i} RETURNING *`,
      vals
    );
    Object.assign(this, new Exercise(r.rows[0]));
    return this;
  }

  async delete() {
    await pool.query(`DELETE FROM exercises WHERE id=$1`, [this.id]);
    return true;
  }
}

module.exports = Exercise;