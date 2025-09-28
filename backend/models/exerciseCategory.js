const { pool } = require("../config/database");

class ExerciseCategory {
  constructor(row) {
    this.id = row.id;
    this.name = row.name;
    this.type = row.type;
    this.description = row.description;
    this.isGymExercise = row.is_gym_exercise || (row.type === 'gym');
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  static async getAll() {
    const r = await pool.query(
      `SELECT * FROM exercise_categories ORDER BY name ASC`
    );
    return r.rows.map((row) => new ExerciseCategory(row));
  }

  static async findById(id) {
    const r = await pool.query(
      `SELECT * FROM exercise_categories WHERE id = $1`,
      [id]
    );
    return r.rows[0] ? new ExerciseCategory(r.rows[0]) : null;
  }

  static async findByType(isGymExercise) {
    const r = await pool.query(
      `SELECT * FROM exercise_categories WHERE is_gym_exercise = $1 ORDER BY name ASC`,
      [isGymExercise]
    );
    return r.rows.map((row) => new ExerciseCategory(row));
  }

  static async create(data) {
    const type = data.isGymExercise ? 'gym' : 'non-gym';
    const r = await pool.query(
      `INSERT INTO exercise_categories (name, type, description, is_gym_exercise)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.name, type, data.description || null, data.isGymExercise || false]
    );
    return new ExerciseCategory(r.rows[0]);
  }

  async update(patch) {
    const allowed = ["name", "type", "description", "is_gym_exercise"];
    const sets = [];
    const vals = [];
    let i = 1;

    for (const col of allowed) {
      let key = col;
      let value = patch[col];
      
      if (col === "is_gym_exercise") {
        key = "isGymExercise";
        value = patch[key];
      }
      
      if (Object.prototype.hasOwnProperty.call(patch, key)) {
        sets.push(`${col}=$${i}`);
        vals.push(value);
        i++;
      }
    }

    // If isGymExercise is being updated, also update the type field
    if (Object.prototype.hasOwnProperty.call(patch, "isGymExercise")) {
      const hasTypeUpdate = sets.some(set => set.startsWith('type='));
      if (!hasTypeUpdate) {
        sets.push(`type=$${i}`);
        vals.push(patch.isGymExercise ? 'gym' : 'non-gym');
        i++;
      }
    }

    if (!sets.length) throw new Error("No valid fields to update");

    vals.push(this.id);
    const r = await pool.query(
      `UPDATE exercise_categories SET ${sets.join(
        ", "
      )}, updated_at=NOW() WHERE id=$${i} RETURNING *`,
      vals
    );
    Object.assign(this, new ExerciseCategory(r.rows[0]));
    return this;
  }

  async delete() {
    await pool.query(`DELETE FROM exercise_categories WHERE id=$1`, [this.id]);
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      description: this.description,
      isGymExercise: this.isGymExercise,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = ExerciseCategory;
