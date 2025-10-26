const { pool } = require("../config/database");

class Exercise {
  constructor(row) {
    this.id = row.id;
    this.name = row.name;
    this.muscle_group = row.muscle_group;
    this.equipment = row.equipment;
    this.difficulty = row.difficulty;
    this.secondary_muscles = row.secondary_muscles;
    this.target = row.target;
    this.category = row.category;
    this.external_id = row.external_id;
    this.gif_url = row.gif_url;
    this.video_url = row.video_url;
    this.image_url = row.image_url;
    this.notes = row.notes;
    this.created_at = row.created_at;
    this.updated_at = row.updated_at;
  }

  static async findAll(limit = 1000) {
    const r = await pool.query(`SELECT * FROM exercises ORDER BY id LIMIT $1`, [
      limit,
    ]);
    return r.rows.map((row) => new Exercise(row));
  }

  static async findById(id) {
    const r = await pool.query(`SELECT * FROM exercises WHERE id=$1 LIMIT 1`, [
      id,
    ]);
    return r.rows[0] ? new Exercise(r.rows[0]) : null;
  }

  static async findByNameAndGroup(name, muscle_group) {
    const r = await pool.query(
      `SELECT * FROM exercises WHERE name=$1 AND COALESCE(muscle_group,'')=COALESCE($2,'') LIMIT 1`,
      [name, muscle_group]
    );
    return r.rows[0] ? new Exercise(r.rows[0]) : null;
  }

  // Find exercises by target token (case-insensitive partial match), limit results
  static async findByTarget(token, limit = 10) {
    if (!token) return [];
    const pattern = `%${token.toLowerCase()}%`;
    const r = await pool.query(
      `SELECT * FROM exercises WHERE lower(coalesce(target,'')) LIKE $1 OR lower(coalesce(muscle_group,'')) LIKE $1 LIMIT $2`,
      [pattern, limit]
    );
    return r.rows.map((row) => new Exercise(row));
  }

  static async create(ex) {
    const r = await pool.query(
      `INSERT INTO exercises (name, muscle_group, equipment, difficulty, secondary_muscles, category, target, external_id, gif_url, video_url, image_url, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        ex.name,
        ex.muscle_group || null,
        ex.equipment || null,
        ex.difficulty || null,
        ex.secondary_muscles || null,
        ex.category || null,
        ex.target || null,
        ex.external_id || null,
        ex.gif_url || null,
        ex.video_url || null,
        ex.image_url || null,
        ex.notes || null,
      ]
    );
    return r.rows[0] ? new Exercise(r.rows[0]) : null;
  }

  static async updateById(id, ex) {
    const r = await pool.query(
      `UPDATE exercises SET name=$1, muscle_group=$2, equipment=$3, difficulty=$4, secondary_muscles=$5, category=$6, target=$7, external_id=$8, gif_url=$9, video_url=$10, image_url=$11, notes=$12 WHERE id=$13 RETURNING *`,
      [
        ex.name,
        ex.muscle_group || null,
        ex.equipment || null,
        ex.difficulty || null,
        ex.secondary_muscles || null,
        ex.category || null,
        ex.target || null,
        ex.external_id || null,
        ex.gif_url || null,
        ex.video_url || null,
        ex.image_url || null,
        ex.notes || null,
        id,
      ]
    );
    return r.rows[0] ? new Exercise(r.rows[0]) : null;
  }
}

module.exports = Exercise;