const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");

function signToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

class UserController {
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
      res
        .status(201)
        .json({
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

  // Password reset code flow
  static async resetRequest(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    const user = await User.findByEmail(email);
    if (!user) return res.json({ ok: true }); // don’t leak

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, code, expires_at, used)
       VALUES ($1,$2,$3,false)`,
      [user.id, code, expiresAt]
    );

    console.log(`🔐 Password reset code for ${email}: ${code}`);
    res.json({ ok: true });
  }

  static async resetConfirm(req, res) {
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
    await pool.query("UPDATE password_reset_tokens SET used=true WHERE id=$1", [
      r.rows[0].id,
    ]);

    res.json({ ok: true });
  }
}

module.exports = UserController;
