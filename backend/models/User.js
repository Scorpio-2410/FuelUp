// models/User.js
const { pool } = require("../config/database");
const bcrypt = require("bcryptjs");

class User {
  constructor(row) {
    this.id = row.id;
    this.email = row.email;
    this.username = row.username;
    this.password = row.password; // <-- maps to DB column "password"

    this.fullName = row.full_name;
    this.dob = row.dob;
    this.gender = row.gender;
    this.ethnicity = row.ethnicity;
    this.avatarUri = row.avatar_uri;

    this.notificationsEnabled = row.notifications_enabled;
    this.followUpFrequency = row.follow_up_frequency;
    this.lastLoginAt = row.last_login_at;

    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  static async create(data) {
    const hashed = await bcrypt.hash(data.password, 10);
    const r = await pool.query(
      `
      INSERT INTO users (
        email, username, password,
        full_name, dob, gender, ethnicity, avatar_uri,
        notifications_enabled, follow_up_frequency
      )
      VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,'not_specified'),$8,
              COALESCE($9,TRUE),COALESCE($10,'daily'))
      RETURNING *
      `,
      [
        data.email,
        data.username,
        hashed,                 // <-- store into "password"
        data.fullName || null,
        data.dob || null,       // DATE (YYYY-MM-DD)
        data.gender || null,
        data.ethnicity || null,
        data.avatarUri || null,
        data.notificationsEnabled,
        data.followUpFrequency,
      ]
    );
    return new User(r.rows[0]);
  }

  static async findById(id) {
    const r = await pool.query(`SELECT * FROM users WHERE id=$1`, [id]);
    return r.rows[0] ? new User(r.rows[0]) : null;
  }

  static async findByEmail(email) {
    const r = await pool.query(`SELECT * FROM users WHERE email=$1`, [email]);
    return r.rows[0] ? new User(r.rows[0]) : null;
  }

  static async findByUsername(username) {
    const r = await pool.query(`SELECT * FROM users WHERE username=$1`, [username]);
    return r.rows[0] ? new User(r.rows[0]) : null;
  }

  async verifyPassword(plain) {
    // compare against this.password (hashed)
    return bcrypt.compare(plain, this.password);
  }

  async setPassword(newPassword) {
    const hashed = await bcrypt.hash(newPassword, 10);
    const r = await pool.query(
      `UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [hashed, this.id]        // <-- update "password"
    );
    Object.assign(this, new User(r.rows[0]));
    return this;
  }

  async touchLogin() {
    await pool.query(`UPDATE users SET last_login_at=NOW() WHERE id=$1`, [this.id]);
  }

  async update(patch) {
    const allowed = [
      "email",
      "username",
      "full_name",
      "dob",
      "gender",
      "ethnicity",
      "avatar_uri",
      "notifications_enabled",
      "follow_up_frequency",
    ];
    const casts = { dob: "::date" };

    const sets = [];
    const vals = [];
    let i = 1;
    for (const col of allowed) {
      if (Object.prototype.hasOwnProperty.call(patch, col)) {
        const cast = casts[col] || "";
        sets.push(`${col}=$${i}${cast}`);
        vals.push(patch[col]);
        i++;
      }
    }
    if (!sets.length) throw new Error("No valid fields to update");
    vals.push(this.id);

    const sql = `UPDATE users SET ${sets.join(", ")}, updated_at=NOW() WHERE id=$${i} RETURNING *`;
    const r = await pool.query(sql, vals);
    Object.assign(this, new User(r.rows[0]));
    return this;
  }

  async delete() {
    await pool.query(`DELETE FROM users WHERE id=$1`, [this.id]);
    return true;
  }

  toJSON() {
    // never return password hash to clients
    const { password, ...rest } = this;
    return rest;
  }
}

module.exports = User;
