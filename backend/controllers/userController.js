const User = require('../models/User');
const jwt = require('jsonwebtoken');

class UserController {
  // Register a new user
  static async register(req, res) {
    try {
      const { username, fullName, email, password, dob, heightCm, weightKg, ethnicity, followUpFrequency, fitnessGoal } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({
          error: 'Username, email, and password are required'
        });
      }

      // Check if user already exists
      const existingUserByEmail = await User.findByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({
          error: 'User with this email already exists'
        });
      }

      const existingUserByUsername = await User.findByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({
          error: 'Username already taken'
        });
      }

      // Create new user
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
        fitnessGoal
      };

      const user = await User.create(userData);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        user: user.toJSON(),
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal server error during registration'
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { identifier, password } = req.body; // identifier can be email or username

      if (!identifier || !password) {
        return res.status(400).json({
          error: 'Email/username and password are required'
        });
      }

      // Find user by email or username
      let user = await User.findByEmail(identifier);
      if (!user) {
        user = await User.findByUsername(identifier);
      }

      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Verify password
      const isValidPassword = await user.verifyPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        user: user.toJSON(),
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error during login'
      });
    }
  }

  // Get user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({
        user: user.toJSON()
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Update user with provided data
      const updatedUser = await user.update(req.body);

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser.toJSON()
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Internal server error during profile update'
      });
    }
  }

  // Delete user account
  static async deleteAccount(req, res) {
    try {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      await user.delete();

      res.json({
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        error: 'Internal server error during account deletion'
      });
    }
  }

  // Get user stats (BMI, recommended calories)
  static async getStats(req, res) {
    try {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const stats = {
        bmi: user.getBMI(),
        recommendedCalories: user.getRecommendedCalories(),
        currentGoal: user.dailyCalorieGoal,
        fitnessGoal: user.fitnessGoal,
        activityLevel: user.activityLevel,
        plan: user.getMacroPlan()
      };

      res.json({
        stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
  
  static async addCheckIn(req, res) {
  try {
    const { date, weightKg, steps, adherencePct } = req.body;
    if (weightKg == null) return res.status(400).json({ error: 'weightKg is required' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const inserted = await User.addCheckIn(req.userId, { date, weightKg, steps, adherencePct });

    // Auto-adjust using last 2 weights (≈ weekly)
    const lastTwo = await User.getLastTwoCheckIns(req.userId);
    let adjustedCalories = null;

    if (lastTwo.length === 2) {
      const now = parseFloat(lastTwo[0].weight_kg);
      const prev = parseFloat(lastTwo[1].weight_kg);
      const delta = now - prev; // kg change since previous check-in

      const goal = user.fitnessGoal || 'general_health';
      let tweak = 0;

      if (goal === 'lose_weight') {
        if (delta > -0.2) tweak = -150;      // not losing → trim 150 kcal
        else if (delta < -0.8) tweak = +150; // losing too fast → add 150
      } else if (goal === 'build_muscle' || goal === 'improve_strength') {
        if (delta < 0.1) tweak = +150;       // gaining too slow
        else if (delta > 0.5) tweak = -150;  // too fast → back off
      }

      if (tweak !== 0) {
        const current = user.getRecommendedCalories(); // your goal-aware calc
        let nextCals = current + tweak;

        // Reuse your safety floor
        if (nextCals < 1200) nextCals = 1200;

        // Persist so UI shows the updated target
        await user.update({ daily_calorie_goal: nextCals });
        adjustedCalories = nextCals;
      }
    }

    res.status(201).json({ checkIn: inserted, adjustedCalories });
  } catch (e) {
    console.error('addCheckIn error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}


}

module.exports = UserController;
