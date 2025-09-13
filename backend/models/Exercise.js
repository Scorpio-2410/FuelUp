// models/Exercise.js
const { pool } = require('../config/database');

class Exercise {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.videoUrl = data.video_url;
    this.muscleGroup = data.muscle_group;
    this.equipmentRequired = data.equipment_required;
    this.difficulty = data.difficulty;
    this.isBodyweight = data.is_bodyweight;
    this.createdAt = data.created_at;
  }

  // ---------- CREATE ----------
  static async create(exerciseData) {
    try {
      const query = `
        INSERT INTO exercises (name, description, video_url, muscle_group, equipment_required, difficulty, is_bodyweight)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const values = [
        exerciseData.name,
        exerciseData.description || null,
        exerciseData.videoUrl || null,
        exerciseData.muscleGroup,
        exerciseData.equipmentRequired || null,
        exerciseData.difficulty,
        exerciseData.isBodyweight || false
      ];
      const result = await pool.query(query, values);
      return new Exercise(result.rows[0]);
    } catch (err) {
      throw new Error(`Error creating exercise: ${err.message}`);
    }
  }

  // ---------- FIND ----------
  static async findById(id) {
    try {
      const result = await pool.query('SELECT * FROM exercises WHERE id = $1', [id]);
      if (result.rows.length === 0) return null;
      return new Exercise(result.rows[0]);
    } catch (err) {
      throw new Error(`Error finding exercise by ID: ${err.message}`);
    }
  }

  static async findAll(limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT * FROM exercises ORDER BY id LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return result.rows.map(row => new Exercise(row));
    } catch (err) {
      throw new Error(`Error fetching exercises: ${err.message}`);
    }
  }

  static async findByFilters({ goal, muscleGroup, difficulty }) {
    try {
      const conditions = [];
      const values = [];
      let index = 1;

      if (muscleGroup) {
        conditions.push(`e.muscle_group = $${index++}`);
        values.push(muscleGroup);
      }
      if (difficulty) {
        conditions.push(`e.difficulty = $${index++}`);
        values.push(difficulty);
      }
      if (goal) {
        conditions.push(`ge.goal = $${index++}`);
        values.push(goal);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT e.*
        FROM exercises e
        LEFT JOIN goal_exercises ge ON ge.exercise_id = e.id
        ${where}
        ORDER BY COALESCE(ge.priority, 999), e.id
        LIMIT 50
      `;

      const result = await pool.query(query, values);
      return result.rows.map(row => new Exercise(row));
    } catch (err) {
      throw new Error(`Error filtering exercises: ${err.message}`);
    }
  }

  // ---------- UPDATE ----------
  async update(updateData) {
    try {
      const allowedFields = [
        'name', 'description', 'video_url', 'muscle_group',
        'equipment_required', 'difficulty', 'is_bodyweight'
      ];

      const setClause = [];
      const values = [];
      let index = 1;

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          setClause.push(`${field} = $${index++}`);
          values.push(updateData[field]);
        }
      }

      if (setClause.length === 0) throw new Error('No valid fields to update');

      values.push(this.id);

      const query = `
        UPDATE exercises
        SET ${setClause.join(', ')}, created_at = created_at
        WHERE id = $${index}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      Object.assign(this, new Exercise(result.rows[0]));
      return this;
    } catch (err) {
      throw new Error(`Error updating exercise: ${err.message}`);
    }
  }

  // ---------- DELETE ----------
  async delete() {
    try {
      const result = await pool.query('DELETE FROM exercises WHERE id = $1', [this.id]);
      if (result.rowCount === 0) throw new Error('Exercise not found');
      return true;
    } catch (err) {
      throw new Error(`Error deleting exercise: ${err.message}`);
    }
  }

  // ---------- JSON ----------
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      videoUrl: this.videoUrl,
      muscleGroup: this.muscleGroup,
      equipmentRequired: this.equipmentRequired,
      difficulty: this.difficulty,
      isBodyweight: this.isBodyweight,
      createdAt: this.createdAt
    };
  }
}

module.exports = Exercise;
