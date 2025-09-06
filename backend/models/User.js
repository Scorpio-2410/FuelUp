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
    const tdee = Math.round(avgBmr * multiplier);

    // Map UI goals → % shift from TDEE
    const goal = this.fitnessGoal || 'general_health';
    const goalAdjust= {
      general_health: 0.00,                // maintain
      recomposition: -0.05,                // small deficit or 0% is fine too
      increase_endurance: 0.05,            // fuel cardio volume
      improve_strength: 0.07,              // small surplus
      build_muscle: 0.12,                  // clearer surplus
      lose_weight: -0.18                   // safe fat-loss start
    };

    const percAdjust = (goalAdjust[goal] ?? 0.00);
    let calories = Math.round(tdee * (1 + percAdjust));

    // Safety rails: cap ±25% swing, enforce a minimum floor i.e. prevent unsafe adjustments
    const maxSwing = Math.round(tdee * 0.25);
    if (calories < tdee - maxSwing) calories = tdee - maxSwing;
    if (calories > tdee + maxSwing) calories = tdee + maxSwing;

    const minSafe = 1200; // or vary by sex
    if (calories < minSafe) calories = minSafe;

    return calories;
  }

    getMacroPlan() {
    const calories = this.getRecommendedCalories();
    if (!this.weightKg) {
      return { calories, protein_g: null, fat_g: null, carbs_g: null };
    }

    const PROTEIN_PER_KG = {
      general_health: 1.6,
      recomposition: 2.0,
      increase_endurance: 1.6,  //requires more carbs but keep protein high(ish)
      improve_strength: 1.8,
      build_muscle: 1.8,
      lose_weight: 2.0  //high protein to maintain muscle mass
    };
    const goal = this.fitnessGoal || 'general_health';
    const proteinPerKg = PROTEIN_PER_KG[goal] ?? 1.6;
    //calculate protein and carbs
    const protein_g = Math.round(proteinPerKg * this.weightKg);
    const fat_g = Math.round(Math.max(0.6 * this.weightKg, 0));
    //calculate allocated calories for fat and protein and remainder is used for carbs
    const usedCal = protein_g * 4 + fat_g * 9; // 1g protein has 4 cals, 1g fat has 9 cals.
    const carbs_g = Math.max(0, Math.round((calories - usedCal) / 4)); // 1g carb has 4 cals. hence total cals - used /4

    const flags = [];
    if (fat_g < Math.round(0.6 * this.weightKg)) flags.push('Low_fat_risk');
    if (calories < 1200) flags.push('floor_capped');

    return {
      calories,
      protein_g,
      fat_g,
      carbs_g,
      flags
    };
  }
}



module.exports = User;
