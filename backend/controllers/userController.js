const User = require("../models/User");
const { pool } = require("../config/database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

class UserController {
  // Register a new user
  static async register(req, res) {
    try {
      const {
        username,
        fullName,
        email,
        password,
        dob,
        heightCm,
        weightKg,
        ethnicity,
        followUpFrequency,
        fitnessGoal,
      } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          error: "Username, email, and password are required",
        });
      }

      const existingUserByEmail = await User.findByEmail(email);
      if (existingUserByEmail) {
        return res
          .status(400)
          .json({ error: "User with this email already exists" });
      }

      const existingUserByUsername = await User.findByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const userData = {
        username,
        fullName,
        email,
        password,
        dob,
        heightCm,
        weightKg,
        ethnicity,
        followUpFrequency,
        fitnessGoal,
      };

      const user = await User.create(userData);

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        message: "User registered successfully",
        user: user.toJSON(),
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res
        .status(500)
        .json({ error: "Internal server error during registration" });
    }
  }

  // Login user
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

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await user.verifyPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ message: "Login successful", user: user.toJSON(), token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error during login" });
    }
  }

  // Reset password ✅
  static async resetPassword(req, res) {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res
          .status(400)
          .json({ error: "Email and new password are required" });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await pool.query(
        "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [hashedPassword, user.id]
      );

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Internal server error during reset" });
    }
  }

  // Get user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ user: user.toJSON() });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const updatedUser = await user.update(req.body);
      res.json({
        message: "Profile updated successfully",
        user: updatedUser.toJSON(),
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res
        .status(500)
        .json({ error: "Internal server error during profile update" });
    }
  }

  // Delete account
  static async deleteAccount(req, res) {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      await user.delete();
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Delete account error:", error);
      res
        .status(500)
        .json({ error: "Internal server error during account deletion" });
    }
  }

  // Get stats
  static async getStats(req, res) {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const stats = {
        bmi: user.getBMI(),
        recommendedCalories: user.getRecommendedCalories(),
        currentGoal: user.dailyCalorieGoal,
        fitnessGoal: user.fitnessGoal,
        activityLevel: user.activityLevel,
      };

      res.json({ stats });
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = UserController;
