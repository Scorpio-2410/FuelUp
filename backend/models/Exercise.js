const { pool } = require('../config/database');

class Exercise {
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
      return new Exercise(result.rows[0]);
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
      
      return new Exercise(result.rows[0]);
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
      
      return result.rows.map(row => new Exercise(row));
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
      
      return result.rows.map(row => new Exercise(row));
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
      
      return result.rows.map(row => new Exercise(row));
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
      
      return result.rows.map(row => new Exercise(row));
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
      Object.assign(this, new Exercise(result.rows[0]));
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
}

module.exports = Exercise;
