const { pool } = require("../config/database");

class MotivationalQuote {
  constructor(row) {
    this.id = row.id;
    this.quoteText = row.quote_text;
    this.authorId = row.author_id;
    this.category = row.category;
    this.isActive = row.is_active;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
    
    // Include author data if joined
    if (row.author_name !== undefined) {
      this.author = {
        id: row.author_id,
        name: row.author_name,
        birthYear: row.author_birth_year,
        deathYear: row.author_death_year,
      };
    }
  }

  static async create(data) {
    const r = await pool.query(
      `INSERT INTO motivational_quotes (quote_text, author_id, category, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        data.quoteText,
        data.authorId || null,
        data.category || 'general',
        data.isActive !== undefined ? data.isActive : true
      ]
    );
    return new MotivationalQuote(r.rows[0]);
  }

  static async findById(id, includeAuthor = true) {
    let query = `SELECT mq.*`;
    if (includeAuthor) {
      query += `, a.name as author_name, a.birth_year as author_birth_year, 
                  a.death_year as author_death_year`;
    }
    query += ` FROM motivational_quotes mq`;
    if (includeAuthor) {
      query += ` LEFT JOIN quote_authors a ON mq.author_id = a.id`;
    }
    query += ` WHERE mq.id=$1`;
    
    const r = await pool.query(query, [id]);
    return r.rows[0] ? new MotivationalQuote(r.rows[0]) : null;
  }

  static async findAll({ category = null, isActive = null, limit = 100, offset = 0 } = {}) {
    let query = `
      SELECT mq.*, a.name as author_name, a.birth_year as author_birth_year, 
             a.death_year as author_death_year
      FROM motivational_quotes mq
      LEFT JOIN quote_authors a ON mq.author_id = a.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND mq.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (isActive !== null) {
      query += ` AND mq.is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    query += ` ORDER BY mq.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const r = await pool.query(query, params);
    return r.rows.map((row) => new MotivationalQuote(row));
  }

  static async getRandom({ category = null, isActive = true } = {}) {
    let query = `
      SELECT mq.*, a.name as author_name, a.birth_year as author_birth_year, 
             a.death_year as author_death_year
      FROM motivational_quotes mq
      LEFT JOIN quote_authors a ON mq.author_id = a.id
      WHERE mq.is_active = $1
    `;
    const params = [isActive];
    let paramIndex = 2;

    if (category) {
      query += ` AND mq.category = $${paramIndex}`;
      params.push(category);
    }

    query += ` ORDER BY RANDOM() LIMIT 1`;

    const r = await pool.query(query, params);
    return r.rows[0] ? new MotivationalQuote(r.rows[0]) : null;
  }

  static async getQuoteOfTheDay() {
    const today = new Date().toISOString().split('T')[0];
    const r = await pool.query(
      `SELECT mq.*, a.name as author_name, a.birth_year as author_birth_year, 
              a.death_year as author_death_year
       FROM motivational_quotes mq
       LEFT JOIN quote_authors a ON mq.author_id = a.id
       WHERE mq.is_active = true
       ORDER BY md5(mq.id::text || $1)
       LIMIT 1`,
      [today]
    );
    return r.rows[0] ? new MotivationalQuote(r.rows[0]) : null;
  }

  static async count({ category = null, isActive = null } = {}) {
    let query = `SELECT COUNT(*) FROM motivational_quotes WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (isActive !== null) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
    }

    const r = await pool.query(query, params);
    return parseInt(r.rows[0].count);
  }

  async update(patch) {
    const allowed = ["quote_text", "author_id", "category", "is_active"];
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
      `UPDATE motivational_quotes SET ${sets.join(", ")}, updated_at=NOW() WHERE id=$${i} RETURNING *`,
      vals
    );
    Object.assign(this, new MotivationalQuote(r.rows[0]));
    return this;
  }

  async delete() {
    await pool.query(`DELETE FROM motivational_quotes WHERE id=$1`, [this.id]);
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      quoteText: this.quoteText,
      authorId: this.authorId,
      author: this.author || null,
      category: this.category,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = MotivationalQuote;

