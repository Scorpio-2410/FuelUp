// controllers/userController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");
const { sendPasswordResetCode } = require("../utils/mailer");

function signToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

class UserController {
  // Public: check if a username is available
  static async checkUsername(req, res) {
    try {
      const username = (req.query.username || "").trim();
      if (!username)
        return res.status(400).json({ error: "username required" });

      const valid = /^[A-Za-z0-9_]{3,20}$/.test(username);
      if (!valid)
        return res.json({ available: false, reason: "invalid_format" });

      const existing = await User.findByUsername(username);
      return res.json({ available: !existing });
    } catch (e) {
      console.error("checkUsername error:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Public: check if an email is available
  static async checkEmail(req, res) {
    try {
      const email = (req.query.email || "").trim();
      if (!email) return res.status(400).json({ error: "email required" });

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk)
        return res.json({ available: false, reason: "invalid_format" });

      const existing = await User.findByEmail(email);
      return res.json({ available: !existing });
    } catch (e) {
      console.error("checkEmail error:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Register a new user (accepts optional profile data too)
  static async register(req, res) {
    try {
      const {
        username,
        email,
        password,
        fullName,
        dob,
        heightCm,
        weightKg,
        gender,
        avatarUri,
        notificationsEnabled,
        followUpFrequency,
        ethnicity,
        fitnessGoal,
        activityLevel,
        dailyCalorieGoal,
      } = req.body;

      if (!username || !email || !password)
        return res
          .status(400)
          .json({ error: "Username, email, and password are required" });

      if (await User.findByEmail(email))
        return res
          .status(400)
          .json({ error: "User with this email already exists" });
      if (await User.findByUsername(username))
        return res.status(400).json({ error: "Username already taken" });

      const user = await User.create({
        username,
        email,
        password,
        fullName,
        dob,
        heightCm,
        weightKg,
        gender,
        avatarUri,
        notificationsEnabled,
        followUpFrequency,
        ethnicity,
        fitnessGoal,
        activityLevel,
        dailyCalorieGoal,
      });

      const token = signToken(user);
      res.status(201).json({
        message: "User registered successfully",
        user: user.toJSON(),
        token,
      });
    } catch (e) {
      console.error("Registration error:", e);
      res
        .status(500)
        .json({ error: "Internal server error during registration" });
    }
  }

  static async login(req, res) {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password)
        return res
          .status(400)
          .json({ error: "Email/username and password are required" });

      let user = await User.findByEmail(identifier);
      if (!user) user = await User.findByUsername(identifier);
      if (!user || !(await user.verifyPassword(password)))
        return res.status(401).json({ error: "Invalid credentials" });

      await user.touchLogin();
      const token = signToken(user);
      res.json({ message: "Login successful", user: user.toJSON(), token });
    } catch (e) {
      console.error("Login error:", e);
      res.status(500).json({ error: "Internal server error during login" });
    }
  }

  static async getProfile(req, res) {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: user.toJSON() });
  }

  static async updateProfile(req, res) {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const updated = await user.update(req.body);
    res.json({
      message: "Profile updated successfully",
      user: updated.toJSON(),
    });
  }

  static async deleteAccount(req, res) {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    await user.delete();
    res.json({ message: "Account deleted successfully" });
  }

  // Password reset: request a code (emails only if user exists; always returns ok)
  static async resetRequest(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email required" });

      const user = await User.findByEmail(email);
      if (!user) return res.json({ ok: true });

      await pool.query(
        "DELETE FROM password_reset_tokens WHERE user_id=$1 AND (used=true OR expires_at<NOW())",
        [user.id]
      );

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, code, expires_at, used)
         VALUES ($1,$2,$3,false)`,
        [user.id, code, expiresAt]
      );

      await sendPasswordResetCode(email, code);
      console.log(`Password reset code created for ${email}`);

      return res.json({ ok: true });
    } catch (e) {
      console.error("resetRequest error:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Password reset: confirm code and set new password
  static async resetConfirm(req, res) {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword)
        return res
          .status(400)
          .json({ error: "Email, code, and newPassword required" });

      const user = await User.findByEmail(email);
      if (!user) return res.status(400).json({ error: "Invalid code" });

      const r = await pool.query(
        `SELECT * FROM password_reset_tokens
         WHERE user_id=$1 AND code=$2 AND used=false AND expires_at>NOW()
         ORDER BY id DESC LIMIT 1`,
        [user.id, code]
      );

      if (r.rows.length === 0)
        return res.status(400).json({ error: "Invalid or expired code" });

      await user.setPassword(newPassword);
      await pool.query(
        "UPDATE password_reset_tokens SET used=true WHERE id=$1",
        [r.rows[0].id]
      );

      return res.json({ ok: true });
    } catch (e) {
      console.error("resetConfirm error:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = UserController;
