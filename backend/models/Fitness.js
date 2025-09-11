const { pool } = require('../config/database');

class Fitness {
  constructor(exerciseData) {
    this.id = exerciseData.id;
    this.userId = exerciseData.user_id;
    this.exerciseName = exerciseData.exercise_name;
    this.exerciseType = exerciseData.exercise_type;
    this.durationMinutes = exerciseData.duration_minutes;
    this.caloriesBurned = exerciseData.calories_burned;
    this.sets = exerciseData.sets;
    this.reps = exerciseData.reps;
    this.weightUsed = exerciseData.weight_used;
    this.distance = exerciseData.distance;
    this.distanceUnit = exerciseData.distance_unit;
    this.intensity = exerciseData.intensity;
    this.exerciseDate = exerciseData.exercise_date;
    this.notes = exerciseData.notes;
    this.createdAt = exerciseData.created_at;
    this.updatedAt = exerciseData.updated_at;
  }

  // Create a new exercise entry
  static async create(exerciseData) {
    try {
      const query = `
        INSERT INTO exercises (user_id, exercise_name, exercise_type, duration_minutes,
                              calories_burned, sets, reps, weight_used, distance, 
                              distance_unit, intensity, exercise_date, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      
      const values = [
        exerciseData.userId,
        exerciseData.exerciseName,
        exerciseData.exerciseType,
        exerciseData.durationMinutes || null,
        exerciseData.caloriesBurned || null,
        exerciseData.sets || null,
        exerciseData.reps || null,
        exerciseData.weightUsed || null,
        exerciseData.distance || null,
        exerciseData.distanceUnit || 'km',
        exerciseData.intensity || null,
        exerciseData.exerciseDate,
        exerciseData.notes || null
      ];

      const result = await pool.query(query, values);
      return new Fitness(result.rows[0]);
    } catch (error) {
      throw new Error(`Error creating exercise: ${error.message}`);
    }
  }

  // Find exercise by ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM exercises WHERE id = $1';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Fitness(result.rows[0]);
    } catch (error) {
      throw new Error(`Error finding exercise by ID: ${error.message}`);
    }
  }

  // Get all exercises for a user
  static async findByUserId(userId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT * FROM exercises 
        WHERE user_id = $1 
        ORDER BY exercise_date DESC, created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await pool.query(query, [userId, limit, offset]);
      
      return result.rows.map(row => new Fitness(row));
    } catch (error) {
      throw new Error(`Error finding exercises for user: ${error.message}`);
    }
  }

  // Get exercises for a specific date
  static async findByUserAndDate(userId, date) {
    try {
      const query = `
        SELECT * FROM exercises 
        WHERE user_id = $1 AND exercise_date = $2
        ORDER BY created_at
      `;
      const result = await pool.query(query, [userId, date]);
      
      return result.rows.map(row => new Fitness(row));
    } catch (error) {
      throw new Error(`Error finding exercises for date: ${error.message}`);
    }
  }

  // Get exercises within a date range
  static async findByDateRange(userId, startDate, endDate) {
    try {
      const query = `
        SELECT * FROM exercises 
        WHERE user_id = $1 AND exercise_date BETWEEN $2 AND $3
        ORDER BY exercise_date DESC, created_at
      `;
      const result = await pool.query(query, [userId, startDate, endDate]);
      
      return result.rows.map(row => new Fitness(row));
    } catch (error) {
      throw new Error(`Error finding exercises in date range: ${error.message}`);
    }
  }

  // Get exercises by type
  static async findByType(userId, exerciseType, limit = 20) {
    try {
      const query = `
        SELECT * FROM exercises 
        WHERE user_id = $1 AND exercise_type = $2
        ORDER BY exercise_date DESC, created_at DESC
        LIMIT $3
      `;
      const result = await pool.query(query, [userId, exerciseType, limit]);
      
      return result.rows.map(row => new Fitness(row));
    } catch (error) {
      throw new Error(`Error finding exercises by type: ${error.message}`);
    }
  }

  // Update exercise
  async update(updateData) {
    try {
      const allowedFields = [
        'exercise_name', 'exercise_type', 'duration_minutes', 'calories_burned',
        'sets', 'reps', 'weight_used', 'distance', 'distance_unit', 
        'intensity', 'exercise_date', 'notes'
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
        UPDATE exercises 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Exercise not found');
      }

      // Update current instance
      Object.assign(this, new Fitness(result.rows[0]));
      return this;
    } catch (error) {
      throw new Error(`Error updating exercise: ${error.message}`);
    }
  }

  // Delete exercise
  async delete() {
    try {
      const query = 'DELETE FROM exercises WHERE id = $1';
      const result = await pool.query(query, [this.id]);
      
      if (result.rowCount === 0) {
        throw new Error('Exercise not found');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error deleting exercise: ${error.message}`);
    }
  }

  // Get daily exercise summary for a user
  static async getDailyExerciseSummary(userId, date) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_exercises,
          SUM(duration_minutes) as total_duration,
          SUM(calories_burned) as total_calories_burned,
          COUNT(DISTINCT exercise_type) as exercise_types_count
        FROM exercises 
        WHERE user_id = $1 AND exercise_date = $2
      `;
      const result = await pool.query(query, [userId, date]);
      
      return {
        totalExercises: parseInt(result.rows[0].total_exercises) || 0,
        totalDuration: parseInt(result.rows[0].total_duration) || 0,
        totalCaloriesBurned: parseFloat(result.rows[0].total_calories_burned) || 0,
        exerciseTypesCount: parseInt(result.rows[0].exercise_types_count) || 0
      };
    } catch (error) {
      throw new Error(`Error getting daily exercise summary: ${error.message}`);
    }
  }

  // Get exercises grouped by type for a specific date
  static async getExercisesByTypeAndDate(userId, date) {
    try {
      const query = `
        SELECT 
          exercise_type,
          COUNT(*) as exercise_count,
          SUM(duration_minutes) as total_duration,
          SUM(calories_burned) as total_calories,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', id,
              'exercise_name', exercise_name,
              'duration_minutes', duration_minutes,
              'calories_burned', calories_burned,
              'sets', sets,
              'reps', reps,
              'weight_used', weight_used,
              'distance', distance,
              'distance_unit', distance_unit,
              'intensity', intensity,
              'notes', notes
            ) ORDER BY created_at
          ) as exercises
        FROM exercises 
        WHERE user_id = $1 AND exercise_date = $2
        GROUP BY exercise_type
        ORDER BY exercise_type
      `;
      const result = await pool.query(query, [userId, date]);
      
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting exercises by type: ${error.message}`);
    }
  }

  // Get weekly exercise statistics
  static async getWeeklyStats(userId, startDate, endDate) {
    try {
      const query = `
        SELECT 
          exercise_date,
          COUNT(*) as daily_exercises,
          SUM(duration_minutes) as daily_duration,
          SUM(calories_burned) as daily_calories,
          STRING_AGG(DISTINCT exercise_type, ', ') as exercise_types
        FROM exercises 
        WHERE user_id = $1 AND exercise_date BETWEEN $2 AND $3
        GROUP BY exercise_date
        ORDER BY exercise_date
      `;
      const result = await pool.query(query, [userId, startDate, endDate]);
      
      return result.rows.map(row => ({
        date: row.exercise_date,
        exerciseCount: parseInt(row.daily_exercises),
        totalDuration: parseInt(row.daily_duration) || 0,
        totalCalories: parseFloat(row.daily_calories) || 0,
        exerciseTypes: row.exercise_types ? row.exercise_types.split(', ') : []
      }));
    } catch (error) {
      throw new Error(`Error getting weekly exercise stats: ${error.message}`);
    }
  }

  // Calculate workout intensity score (basic algorithm)
  getIntensityScore() {
    let score = 0;
    
    // Base score from duration
    if (this.durationMinutes) {
      score += this.durationMinutes * 0.5;
    }
    
    // Add score based on exercise type
    const typeMultipliers = {
      'cardio': 1.2,
      'strength': 1.5,
      'flexibility': 0.8,
      'sports': 1.3
    };
    
    const multiplier = typeMultipliers[this.exerciseType.toLowerCase()] || 1.0;
    score *= multiplier;
    
    // Add intensity bonus
    const intensityMultipliers = {
      'low': 0.8,
      'moderate': 1.0,
      'high': 1.4
    };
    
    if (this.intensity) {
      const intensityBonus = intensityMultipliers[this.intensity.toLowerCase()] || 1.0;
      score *= intensityBonus;
    }
    
    return Math.round(score);
  }

  // Validate exercise type
  static validateExerciseType(exerciseType) {
    const validTypes = ['cardio', 'strength', 'flexibility', 'sports'];
    return validTypes.includes(exerciseType.toLowerCase());
  }

  // Validate intensity level
  static validateIntensity(intensity) {
    if (!intensity) return true; // Intensity is optional
    const validIntensities = ['low', 'moderate', 'high'];
    return validIntensities.includes(intensity.toLowerCase());
  }

  // FITNESS PREFERENCES METHODS

  // Create or update fitness preferences for a user
  static async createOrUpdateFitnessPreferences(userId, fitnessData) {
    try {
      const query = `
        INSERT INTO fitness (user_id, goal, activity_level, experience_level, 
                           days_per_week, session_length_min, training_location,
                           equipment_available, preferred_activities, injuries_or_limitations,
                           coaching_style)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (user_id) 
        DO UPDATE SET
          goal = EXCLUDED.goal,
          activity_level = EXCLUDED.activity_level,
          experience_level = EXCLUDED.experience_level,
          days_per_week = EXCLUDED.days_per_week,
          session_length_min = EXCLUDED.session_length_min,
          training_location = EXCLUDED.training_location,
          equipment_available = EXCLUDED.equipment_available,
          preferred_activities = EXCLUDED.preferred_activities,
          injuries_or_limitations = EXCLUDED.injuries_or_limitations,
          coaching_style = EXCLUDED.coaching_style,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const values = [
        userId,
        fitnessData.goal,
        fitnessData.activityLevel,
        fitnessData.experienceLevel,
        fitnessData.daysPerWeek || 3,
        fitnessData.sessionLengthMin || 60,
        fitnessData.trainingLocation,
        JSON.stringify(fitnessData.equipmentAvailable || []),
        JSON.stringify(fitnessData.preferredActivities || []),
        fitnessData.injuriesOrLimitations,
        fitnessData.coachingStyle
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating/updating fitness preferences: ${error.message}`);
    }
  }

  // Get fitness preferences by user ID
  static async getFitnessPreferences(userId) {
    try {
      const query = 'SELECT * FROM fitness WHERE user_id = $1';
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const prefs = result.rows[0];
      return {
        id: prefs.id,
        userId: prefs.user_id,
        goal: prefs.goal,
        activityLevel: prefs.activity_level,
        experienceLevel: prefs.experience_level,
        daysPerWeek: prefs.days_per_week,
        sessionLengthMin: prefs.session_length_min,
        trainingLocation: prefs.training_location,
        equipmentAvailable: prefs.equipment_available ? JSON.parse(prefs.equipment_available) : [],
        preferredActivities: prefs.preferred_activities ? JSON.parse(prefs.preferred_activities) : [],
        injuriesOrLimitations: prefs.injuries_or_limitations,
        coachingStyle: prefs.coaching_style,
        updatedAt: prefs.updated_at
      };
    } catch (error) {
      throw new Error(`Error finding fitness preferences: ${error.message}`);
    }
  }

  // Update fitness preferences
  static async updateFitnessPreferences(userId, updateData) {
    try {
      const allowedFields = [
        'goal', 'activity_level', 'experience_level', 'days_per_week',
        'session_length_min', 'training_location', 'equipment_available',
        'preferred_activities', 'injuries_or_limitations', 'coaching_style'
      ];

      const setClause = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic update query
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          // Handle JSON fields
          if (field === 'equipment_available' || field === 'preferred_activities') {
            setClause.push(`${field} = $${paramIndex}`);
            values.push(JSON.stringify(updateData[field]));
          } else {
            setClause.push(`${field} = $${paramIndex}`);
            values.push(updateData[field]);
          }
          paramIndex++;
        }
      }

      if (setClause.length === 0) {
        throw new Error('No valid fields to update');
      }

      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const query = `
        UPDATE fitness 
        SET ${setClause.join(', ')}
        WHERE user_id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Fitness preferences not found');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating fitness preferences: ${error.message}`);
    }
  }

  // Delete fitness preferences
  static async deleteFitnessPreferences(userId) {
    try {
      const query = 'DELETE FROM fitness WHERE user_id = $1';
      const result = await pool.query(query, [userId]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Error deleting fitness preferences: ${error.message}`);
    }
  }

  // Get workout recommendations based on fitness preferences
  static async getWorkoutRecommendations(userId) {
    try {
      const fitnessPrefs = await Fitness.getFitnessPreferences(userId);
      if (!fitnessPrefs) {
        return null;
      }

      // Generate basic recommendations based on preferences
      const recommendations = {
        frequency: Fitness.getRecommendedFrequency(fitnessPrefs.experienceLevel),
        intensity: Fitness.getIntensityRecommendations(fitnessPrefs.experienceLevel),
        workoutTypes: [],
        tips: []
      };

      // Add workout type recommendations based on goal
      switch (fitnessPrefs.goal) {
        case 'weight_loss':
          recommendations.workoutTypes = ['cardio', 'hiit', 'circuit_training'];
          recommendations.tips = [
            'Focus on high-intensity interval training for maximum calorie burn',
            'Combine cardio with strength training for best results',
            'Stay consistent with your workout schedule'
          ];
          break;
        case 'muscle_gain':
          recommendations.workoutTypes = ['strength_training', 'resistance', 'compound_movements'];
          recommendations.tips = [
            'Focus on compound exercises like squats, deadlifts, and bench press',
            'Progressive overload is key to muscle growth',
            'Allow adequate rest between strength training sessions'
          ];
          break;
        case 'endurance':
          recommendations.workoutTypes = ['cardio', 'running', 'cycling', 'swimming'];
          recommendations.tips = [
            'Gradually increase workout duration and intensity',
            'Include both steady-state and interval training',
            'Focus on proper breathing techniques'
          ];
          break;
        default:
          recommendations.workoutTypes = ['full_body', 'cardio', 'flexibility'];
          recommendations.tips = [
            'Maintain a balanced routine with cardio, strength, and flexibility',
            'Listen to your body and adjust intensity as needed',
            'Consistency is more important than intensity'
          ];
      }

      return {
        userPreferences: fitnessPrefs,
        recommendations
      };
    } catch (error) {
      throw new Error(`Error generating workout recommendations: ${error.message}`);
    }
  }

  // Helper method to get recommended frequency based on experience level
  static getRecommendedFrequency(experienceLevel) {
    const recommendations = {
      'beginner': { min: 2, max: 3, sessionLength: 45 },
      'intermediate': { min: 3, max: 4, sessionLength: 60 },
      'advanced': { min: 4, max: 6, sessionLength: 75 }
    };

    return recommendations[experienceLevel] || recommendations['intermediate'];
  }

  // Helper method to get intensity recommendations based on experience level
  static getIntensityRecommendations(experienceLevel) {
    const intensityLevels = {
      'beginner': ['low', 'moderate'],
      'intermediate': ['moderate', 'high'],
      'advanced': ['moderate', 'high', 'very_high']
    };

    return intensityLevels[experienceLevel] || intensityLevels['intermediate'];
  }
}

module.exports = Fitness;
