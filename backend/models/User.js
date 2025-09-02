const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.username = userData.username;
    this.fullName = userData.full_name;
    this.email = userData.email;
    this.password = userData.password;
    this.dob = userData.dob;
    this.heightCm = userData.height_cm;
    this.weightKg = userData.weight_kg;
    this.notifications = userData.notifications;
    this.avatarUri = userData.avatar_uri;
    this.ethnicity = userData.ethnicity;
    this.followUpFrequency = userData.follow_up_frequency;
    this.fitnessGoal = userData.fitness_goal;
    this.activityLevel = userData.activity_level;
    this.dailyCalorieGoal = userData.daily_calorie_goal;
    this.createdAt = userData.created_at;
    this.updatedAt = userData.updated_at;
  }

  // Create a new user
  static async create(userData) {
    try {
      // Hash password before storing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      const query = `
        INSERT INTO users (username, full_name, email, password, dob, 
                          height_cm, weight_kg, notifications, avatar_uri, ethnicity,
                          follow_up_frequency, fitness_goal, activity_level, daily_calorie_goal)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      
      const values = [
        userData.username,
        userData.fullName,
        userData.email,
        hashedPassword,
        userData.dob,
        userData.heightCm,
        userData.weightKg,
        userData.notifications !== undefined ? userData.notifications : true,
        userData.avatarUri,
        userData.ethnicity || 'not_specified',
        userData.followUpFrequency || 'daily',
        userData.fitnessGoal || 'general_health',
        userData.activityLevel || 'moderate',
        userData.dailyCalorieGoal || 2000
      ];

      const result = await pool.query(query, values);
      return new User(result.rows[0]);
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const query = 'SELECT * FROM users WHERE username = $1';
      const result = await pool.query(query, [username]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      throw new Error(`Error finding user by username: ${error.message}`);
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  // Verify password
  async verifyPassword(plainPassword) {
    try {
      return await bcrypt.compare(plainPassword, this.password);
    } catch (error) {
      throw new Error(`Error verifying password: ${error.message}`);
    }
  }

  // Update user profile
  async update(updateData) {
    try {
      const allowedFields = [
        'username', 'full_name', 'email', 'dob', 'height_cm', 'weight_kg',
        'notifications', 'avatar_uri', 'ethnicity', 'follow_up_frequency',
        'fitness_goal', 'activity_level', 'daily_calorie_goal'
      ];

      const setClause = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic update query
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          setClause.push(`${field} = $${paramIndex}`);
          values.push(updateData[field]);
          paramIndex++;
        }
      }

      if (setClause.length === 0) {
        throw new Error('No valid fields to update');
      }

      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(this.id);

      const query = `
        UPDATE users 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      // Update current instance
      Object.assign(this, new User(result.rows[0]));
      return this;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // Delete user
  async delete() {
    try {
      const query = 'DELETE FROM users WHERE id = $1';
      await pool.query(query, [this.id]);
      return true;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  // Get user without password (for API responses)
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  // Calculate BMI
  getBMI() {
    if (!this.heightCm || !this.weightKg) {
      return null;
    }
    // Height is in cm and weight is in kg
    const heightInMeters = this.heightCm / 100;
    return (this.weightKg / (heightInMeters * heightInMeters)).toFixed(1);
  }

  // Calculate recommended daily calories based on profile
  getRecommendedCalories() {
    if (!this.weightKg || !this.heightCm || !this.dob) {
      return this.dailyCalorieGoal || 2000;
    }

    // Calculate age
    const today = new Date();
    const birthDate = new Date(this.dob);
    const age = today.getFullYear() - birthDate.getFullYear();

    // Harris-Benedict Equation (assuming no gender field in frontend, using moderate estimate)
    // Using average between male and female equations for general calculation
    const avgBmr = (
      (88.362 + (13.397 * this.weightKg) + (4.799 * this.heightCm) - (5.677 * age)) +
      (447.593 + (9.247 * this.weightKg) + (3.098 * this.heightCm) - (4.330 * age))
    ) / 2;

    // Activity level multipliers
    const activityMultipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very_active': 1.9
    };

    const multiplier = activityMultipliers[this.activityLevel] || 1.55;
    return Math.round(avgBmr * multiplier);
  }
}

module.exports = User;
