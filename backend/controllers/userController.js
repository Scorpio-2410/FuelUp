// controllers/userController.js
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { pool } = require("../config/database");
const { sendPasswordResetCode } = require("../utils/mailer");

function signToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Keep DOB as plain "YYYY-MM-DD" (no timezone conversions).
 */
function toPlainDate(input) {
  if (!input) return null;
  if (typeof input === "string") {
    const m = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
  }
  if (input instanceof Date) {
    const y = input.getFullYear();
    const m = String(input.getMonth() + 1).padStart(2, "0");
    const d = String(input.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
}

function safeUserJSON(user) {
  const out = user.toJSON();
  if (out.dob) out.dob = toPlainDate(out.dob);
  return out;
}

class UserController {
  // -------- public checks --------
  static async checkUsername(req, res) {
    try {
      const username = (req.query.username || "").trim();
      if (!username)
        return res.status(400).json({ error: "username required" });

      const formatOk = /^[A-Za-z0-9_]{3,20}$/.test(username);
      if (!formatOk)
        return res.json({ available: false, reason: "invalid_format" });

      const existing = await User.findByUsername(username);
      return res.json({ available: !existing });
    } catch (e) {
      console.error("checkUsername error:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async checkEmail(req, res) {
    try {
      const email = (req.query.email || "").trim();
      if (!email) return res.status(400).json({ error: "email required" });

      const formatOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!formatOk)
        return res.json({ available: false, reason: "invalid_format" });

      const existing = await User.findByEmail(email);
      return res.json({ available: !existing });
    } catch (e) {
      console.error("checkEmail error:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // -------- auth --------
  static async register(req, res) {
    try {
      const {
        username,
        email,
        password,
        fullName,
        dob,
        gender,
        avatarUri,
        notificationsEnabled,
        followUpFrequency,
        ethnicity,
      } = req.body;

      if (!username || !email || !password) {
        return res
          .status(400)
          .json({ error: "Username, email, and password are required" });
      }

      // basic format validations
      if (!/^[A-Za-z0-9_]{3,20}$/.test(String(username))) {
        return res.status(400).json({ error: "Invalid username format" });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      if (
        followUpFrequency &&
        !["daily", "weekly", "monthly"].includes(followUpFrequency)
      ) {
        return res.status(400).json({ error: "Invalid follow_up_frequency" });
      }

      // unique checks (fast fail before DB throws 23505)
      if (await User.findByEmail(email)) {
        return res
          .status(400)
          .json({ error: "User with this email already exists" });
      }
      if (await User.findByUsername(username)) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // create the user
      const user = await User.create({
        username,
        email,
        password,
        fullName,
        dob: toPlainDate(dob),
        gender,
        avatarUri,
        notificationsEnabled,
        followUpFrequency, // defaults handled in model/DB
        ethnicity,
      });

      // create 1:1 shells so the app has rows to upsert into
      // fitness_profiles
      await pool.query(
        `INSERT INTO fitness_profiles (user_id)
         VALUES ($1)
         ON CONFLICT (user_id) DO NOTHING`,
        [user.id]
      );

      // nutrition_profiles (merged prefs+targets)
      await pool.query(
        `INSERT INTO nutrition_profiles (user_id, daily_calorie_target)
         VALUES ($1, 2000)
         ON CONFLICT (user_id) DO NOTHING`,
        [user.id]
      );

      // schedules (1:1)
      await pool.query(
        `INSERT INTO schedules (user_id)
         VALUES ($1)
         ON CONFLICT (user_id) DO NOTHING`,
        [user.id]
      );

      const token = signToken(user);
      res.status(201).json({
        message: "User registered successfully",
        user: safeUserJSON(user),
        token,
      });
    } catch (e) {
      // handle unique violations nicely
      if (e.code === "23505") {
        return res
          .status(400)
          .json({ error: "Email or username already in use" });
      }
      console.error("Registration error:", e);
      res
        .status(500)
        .json({ error: "Internal server error during registration" });
    }
  }

  static async login(req, res) {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res
          .status(400)
          .json({ error: "Email/username and password are required" });
      }

      let user = await User.findByEmail(identifier);
      if (!user) user = await User.findByUsername(identifier);
      if (!user || !(await user.verifyPassword(password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      await user.touchLogin();
      const token = signToken(user);
      res.json({
        message: "Login successful",
        user: safeUserJSON(user),
        token,
      });
    } catch (e) {
      console.error("Login error:", e);
      res.status(500).json({ error: "Internal server error during login" });
    }
  }

  // -------- profile --------
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ user: safeUserJSON(user) });
    } catch (e) {
      console.error("getProfile error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async updateProfile(req, res) {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const patch = {};
      if ("email" in req.body) patch.email = req.body.email;
      if ("username" in req.body) patch.username = req.body.username;
      if ("full_name" in req.body) patch.full_name = req.body.full_name;
      if ("dob" in req.body) patch.dob = toPlainDate(req.body.dob);
      if ("gender" in req.body) patch.gender = req.body.gender;
      if ("avatar_uri" in req.body) patch.avatar_uri = req.body.avatar_uri;
      if ("notifications_enabled" in req.body)
        patch.notifications_enabled = !!req.body.notifications_enabled;
      if ("follow_up_frequency" in req.body) {
        const v = req.body.follow_up_frequency;
        if (!["daily", "weekly", "monthly"].includes(v)) {
          return res.status(400).json({ error: "Invalid follow_up_frequency" });
        }
        patch.follow_up_frequency = v;
      }
      if ("ethnicity" in req.body) patch.ethnicity = req.body.ethnicity;

      const updated = await user.update(patch);
      res.json({
        message: "Profile updated successfully",
        user: safeUserJSON(updated),
      });
    } catch (e) {
      if (e.code === "23505") {
        return res
          .status(400)
          .json({ error: "Email or username already in use" });
      }
      console.error("updateProfile error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async deleteAccount(req, res) {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      await user.delete();
      res.json({ message: "Account deleted successfully" });
    } catch (e) {
      console.error("deleteAccount error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // -------- stats (uses fitness_profiles & nutrition_profiles) --------
  static async getStats(req, res) {
    try {
      const { rows } = await pool.query(
        `SELECT
           fp.height_cm,
           fp.weight_kg,
           fp.goal AS fitness_goal,
           np.daily_calorie_target
         FROM users u
         LEFT JOIN fitness_profiles   fp ON fp.user_id = u.id
         LEFT JOIN nutrition_profiles np ON np.user_id = u.id
         WHERE u.id = $1
         LIMIT 1`,
        [req.userId]
      );

      if (!rows.length) {
        return res.status(404).json({ error: "User not found" });
      }

      const r = rows[0] || {};
      let bmi = null;
      if (r.height_cm && r.weight_kg) {
        const h = Number(r.height_cm) / 100;
        const w = Number(r.weight_kg);
        if (h > 0 && w > 0) bmi = Number((w / (h * h)).toFixed(1));
      }

      res.json({
        stats: {
          bmi,
          recommendedCalories:
            r.daily_calorie_target != null
              ? Number(r.daily_calorie_target)
              : 2000,
          fitnessGoal: r.fitness_goal || "general_health",
        },
      });
    } catch (e) {
      console.error("getStats error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // -------- password reset --------
  static async resetRequest(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email required" });

      const user = await User.findByEmail(email);
      if (!user) return res.json({ ok: true });

      // clear any expired/used codes
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
      return res.json({ ok: true });
    } catch (e) {
      console.error("resetRequest error:", e);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async resetConfirm(req, res) {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        return res
          .status(400)
          .json({ error: "Email, code, and newPassword required" });
      }

      const user = await User.findByEmail(email);
      if (!user) return res.status(400).json({ error: "Invalid code" });

      const r = await pool.query(
        `SELECT * FROM password_reset_tokens
         WHERE user_id=$1 AND code=$2 AND used=false AND expires_at>NOW()
         ORDER BY id DESC LIMIT 1`,
        [user.id, code]
      );
      if (r.rows.length === 0) {
        return res.status(400).json({ error: "Invalid or expired code" });
      }

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
