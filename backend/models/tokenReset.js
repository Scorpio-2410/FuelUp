const { pool } = require("../config/database");

class PasswordResetToken {
  static async create(userId, code, expiresAt) {
    const r = await pool.query(
      `INSERT INTO password_reset_tokens (user_id, code, expires_at, used)
       VALUES ($1,$2,$3,false)
       RETURNING *`,
      [userId, code, expiresAt]
    );
    return r.rows[0];
  }

  static async latestValid(userId, code) {
    const r = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE user_id=$1 AND code=$2 AND used=false AND expires_at>NOW()
       ORDER BY id DESC LIMIT 1`,
      [userId, code]
    );
    return r.rows[0] || null;
  }

  static async markUsed(id) {
    await pool.query(`UPDATE password_reset_tokens SET used=true WHERE id=$1`, [
      id,
    ]);
  }

  static async cleanupForUser(userId) {
    await pool.query(
      `DELETE FROM password_reset_tokens
       WHERE user_id=$1 AND (used=true OR expires_at<NOW())`,
      [userId]
    );
  }
}

module.exports = PasswordResetToken;
