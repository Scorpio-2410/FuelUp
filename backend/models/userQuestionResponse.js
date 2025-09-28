const { pool } = require("../config/database");

class UserQuestionResponse {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.questionId = row.question_id;
    this.responseValue = row.response_value;
    this.responseText = row.response_text;
    this.askedAt = row.asked_at;
    this.createdAt = row.created_at;
  }

  static async create(data) {
    const r = await pool.query(
      `INSERT INTO user_question_responses
        (user_id, question_id, response_value, response_text, asked_at)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [
        data.userId,
        data.questionId,
        data.responseValue,
        data.responseText || null,
        data.askedAt || new Date(),
      ]
    );
    return new UserQuestionResponse(r.rows[0]);
  }

  static async findById(id) {
    const r = await pool.query(`SELECT * FROM user_question_responses WHERE id=$1`, [id]);
    return r.rows[0] ? new UserQuestionResponse(r.rows[0]) : null;
  }

  static async findByUser(userId, { limit = 50, offset = 0, questionId = null, since = null } = {}) {
    let query = `SELECT * FROM user_question_responses WHERE user_id = $1`;
    const params = [userId];
    let paramIndex = 2;

    if (questionId) {
      query += ` AND question_id = $${paramIndex}`;
      params.push(questionId);
      paramIndex++;
    }

    if (since) {
      query += ` AND asked_at > $${paramIndex}`;
      params.push(since);
      paramIndex++;
    }

    query += ` ORDER BY asked_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const r = await pool.query(query, params);
    return r.rows.map((row) => new UserQuestionResponse(row));
  }

  static async getResponseHistory(userId, questionId, daysBack = 30) {
    const r = await pool.query(
      `SELECT * FROM user_question_responses 
       WHERE user_id = $1 AND question_id = $2 
       AND asked_at > NOW() - INTERVAL '${daysBack} days'
       ORDER BY asked_at DESC`,
      [userId, questionId]
    );
    return r.rows.map((row) => new UserQuestionResponse(row));
  }

  static async getUserInsights(userId, daysBack = 30) {
    const r = await pool.query(
      `SELECT 
        tq.text as question_text,
        tq.category,
        tq.type as question_type,
        AVG(uqr.response_value) as avg_response,
        COUNT(uqr.id) as response_count,
        MAX(uqr.asked_at) as last_response_date
       FROM user_question_responses uqr
       JOIN target_questions tq ON uqr.question_id = tq.id
       WHERE uqr.user_id = $1 
       AND uqr.asked_at > NOW() - INTERVAL '${daysBack} days'
       GROUP BY tq.id, tq.text, tq.category, tq.type
       ORDER BY tq.influence_weight DESC, avg_response DESC`,
      [userId]
    );
    return r.rows;
  }

  static async saveResponses(userId, responses) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const savedResponses = [];
      for (const response of responses) {
        const r = await client.query(
          `INSERT INTO user_question_responses
            (user_id, question_id, response_value, response_text, asked_at)
           VALUES ($1,$2,$3,$4,$5)
           RETURNING *`,
          [
            userId,
            response.questionId,
            response.responseValue,
            response.responseText || null,
            new Date(),
          ]
        );
        savedResponses.push(new UserQuestionResponse(r.rows[0]));
      }
      
      await client.query('COMMIT');
      return savedResponses;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete() {
    await pool.query(`DELETE FROM user_question_responses WHERE id=$1`, [this.id]);
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      questionId: this.questionId,
      responseValue: this.responseValue,
      responseText: this.responseText,
      askedAt: this.askedAt,
      createdAt: this.createdAt,
    };
  }
}

module.exports = UserQuestionResponse;
