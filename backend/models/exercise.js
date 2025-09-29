const { pool } = require("../config/database");

class Exercise {
  constructor(row) {
    this.id = row.id;
    this.categoryId = row.category_id;

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

    // Category information if joined
    if (row.category_name) {
      this.category = {
        id: row.category_id,
        name: row.category_name,
        description: row.category_description,
        isGymExercise: row.category_is_gym_exercise,
      };
    }
  }

  static async create(data) {
    const r = await pool.query(
      `INSERT INTO exercises
        (category_id, name, muscle_group, equipment, difficulty,
         duration_min, sets, reps, rest_seconds, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        data.categoryId || null,
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

  // List all exercises (now globally accessible)
  static async listAll({ limit = 50, offset = 0, categoryId = null } = {}) {
    let query = `
      SELECT e.*, 
             ec.name as category_name,
             ec.description as category_description,
             ec.is_gym_exercise as category_is_gym_exercise
      FROM exercises e
      LEFT JOIN exercise_categories ec ON e.category_id = ec.id
      WHERE 1=1`;
    
    const params = [];
    let paramIndex = 1;

    if (categoryId !== null) {
      query += ` AND e.category_id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    query += ` ORDER BY e.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const r = await pool.query(query, params);
    return r.rows.map((row) => new Exercise(row));
  }

  // Get exercise by ID (now globally accessible)
  static async getById(id) {
    const r = await pool.query(
      `SELECT e.*, 
             ec.name as category_name,
             ec.description as category_description,
             ec.is_gym_exercise as category_is_gym_exercise
       FROM exercises e
       LEFT JOIN exercise_categories ec ON e.category_id = ec.id
       WHERE e.id = $1`,
      [id]
    );
    return r.rows[0] ? new Exercise(r.rows[0]) : null;
  }

  // Note: listByPlan method removed since exercises are no longer tied to plans

  static async findById(id) {
    const r = await pool.query(`SELECT * FROM exercises WHERE id=$1`, [id]);
    return r.rows[0] ? new Exercise(r.rows[0]) : null;
  }

  // Static method to update exercise (no ownership check needed)
  static async update(id, patch) {
    const exercise = await Exercise.getById(id);
    if (!exercise) return null;
    
    return await exercise.update(patch);
  }

  // Static method to remove exercise (no ownership check needed)
  static async remove(id) {
    const exercise = await Exercise.getById(id);
    if (!exercise) return false;
    
    await exercise.delete();
    return true;
  }

  async update(patch) {
    const allowed = [
      "name",
      "category_id",
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

  toJSON() {
    return {
      id: this.id,
      categoryId: this.categoryId,
      category: this.category,
      name: this.name,
      muscleGroup: this.muscleGroup,
      equipment: this.equipment,
      difficulty: this.difficulty,
      durationMin: this.durationMin,
      sets: this.sets,
      reps: this.reps,
      restSeconds: this.restSeconds,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Exercise;
