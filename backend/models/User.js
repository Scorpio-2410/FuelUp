const { pool } = require("../config/database");
const bcrypt = require("bcryptjs");

class User {
  constructor(row) {
    this.id = row.id;
    this.email = row.email;
    this.username = row.username;
    this.passwordHash = row.password_hash;
    this.fullName = row.full_name;
    this.dob = row.dob;
    this.gender = row.gender;
    this.avatarUri = row.avatar_uri;
    this.notificationsEnabled = row.notifications_enabled;
    this.lastLoginAt = row.last_login_at;
    this.followUpFrequency = row.follow_up_frequency;
    this.ethnicity = row.ethnicity;
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  static async create(data) {
    const hashed = await bcrypt.hash(data.password, 10);
    const q = `
      INSERT INTO users (
        email, username, password_hash, full_name, dob,
        gender, avatar_uri, notifications_enabled, follow_up_frequency, ethnicity
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8,TRUE),COALESCE($9,'daily'),COALESCE($10,'not_specified'))
      RETURNING *`;
    const v = [
      data.email,
      data.username,
      hashed,
      data.fullName || null,
      data.dob || null, // DATE
      data.gender || null,
      data.avatarUri || null,
      data.notificationsEnabled,
      data.followUpFrequency,
      data.ethnicity,
    ];
    const r = await pool.query(q, v);
    return new User(r.rows[0]);
  }

  static async findByEmail(email) {
    const r = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    return r.rows[0] ? new User(r.rows[0]) : null;
  }

  static async findByUsername(username) {
    const r = await pool.query("SELECT * FROM users WHERE username=$1", [
      username,
    ]);
    return r.rows[0] ? new User(r.rows[0]) : null;
  }

  static async findById(id) {
    const r = await pool.query("SELECT * FROM users WHERE id=$1", [id]);
    return r.rows[0] ? new User(r.rows[0]) : null;
  }

  async verifyPassword(plain) {
    return bcrypt.compare(plain, this.passwordHash);
  }

  async setPassword(newPassword) {
    const hashed = await bcrypt.hash(newPassword, 10);
    const r = await pool.query(
      "UPDATE users SET password_hash=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *",
      [hashed, this.id]
    );
    Object.assign(this, new User(r.rows[0]));
    return this;
  }

  async touchLogin() {
    await pool.query("UPDATE users SET last_login_at=NOW() WHERE id=$1", [
      this.id,
    ]);
  }

  async update(updateData) {
    const allowed = [
      "email",
      "username",
      "full_name",
      "dob",
      "gender",
      "avatar_uri",
      "notifications_enabled",
      "follow_up_frequency",
      "ethnicity",
    ];
    const casts = { dob: "::date" };

    const sets = [];
    const vals = [];
    let i = 1;
    for (const col of allowed) {
      if (Object.prototype.hasOwnProperty.call(updateData, col)) {
        const cast = casts[col] || "";
        sets.push(`${col}=$${i}${cast}`);
        vals.push(updateData[col]);
        i++;
      }
    }
    if (!sets.length) throw new Error("No valid fields to update");
    vals.push(this.id);

    const sql = `UPDATE users SET ${sets.join(
      ", "
    )}, updated_at=CURRENT_TIMESTAMP
                 WHERE id=$${i} RETURNING *`;
    const r = await pool.query(sql, vals);
    if (!r.rows[0]) throw new Error("User not found after update");
    Object.assign(this, new User(r.rows[0]));
    return this;
  }

  async delete() {
    await pool.query("DELETE FROM users WHERE id=$1", [this.id]);
    return true;
  }

  toJSON() {
    const { passwordHash, ...rest } = this;
    return rest;
  }
}

module.exports = User;
