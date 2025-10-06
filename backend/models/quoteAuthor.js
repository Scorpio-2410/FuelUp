const { pool } = require("../config/database");

class QuoteAuthor {
  constructor(row) {
    this.id = row.id;
    this.name = row.name;
    this.birthYear = row.birth_year;
    this.deathYear = row.death_year;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  static async create(data) {
    const r = await pool.query(
      `INSERT INTO quote_authors (name, birth_year, death_year)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.name, data.birthYear || null, data.deathYear || null]
    );
    return new QuoteAuthor(r.rows[0]);
  }

  static async findById(id) {
    const r = await pool.query(`SELECT * FROM quote_authors WHERE id=$1`, [id]);
    return r.rows[0] ? new QuoteAuthor(r.rows[0]) : null;
  }

  static async findByName(name) {
    const r = await pool.query(`SELECT * FROM quote_authors WHERE name=$1`, [name]);
    return r.rows[0] ? new QuoteAuthor(r.rows[0]) : null;
  }

  static async findOrCreate(data) {
    const existing = await QuoteAuthor.findByName(data.name);
    if (existing) return existing;
    return await QuoteAuthor.create(data);
  }

  static async findAll({ limit = 100, offset = 0 } = {}) {
    const r = await pool.query(
      `SELECT * FROM quote_authors ORDER BY name ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return r.rows.map((row) => new QuoteAuthor(row));
  }

  async update(patch) {
    const allowed = ["name", "birth_year", "death_year"];
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
      `UPDATE quote_authors SET ${sets.join(", ")}, updated_at=NOW() WHERE id=$${i} RETURNING *`,
      vals
    );
    Object.assign(this, new QuoteAuthor(r.rows[0]));
    return this;
  }

  async delete() {
    await pool.query(`DELETE FROM quote_authors WHERE id=$1`, [this.id]);
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      birthYear: this.birthYear,
      deathYear: this.deathYear,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = QuoteAuthor;

