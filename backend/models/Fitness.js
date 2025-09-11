const { pool } = require('../config/database');

class Fitness {
  constructor(fitnessData) {
    this.id = fitnessData.id;
    this.userId = fitnessData.user_id;
    this.goal = fitnessData.goal;
    this.activityLevel = fitnessData.activity_level;
    this.experienceLevel = fitnessData.experience_level;
    this.daysPerWeek = fitnessData.days_per_week;
    this.sessionLengthMin = fitnessData.session_length_min;
    this.trainingLocation = fitnessData.training_location;
    this.equipmentAvailable = fitnessData.equipment_available ? 
      JSON.parse(fitnessData.equipment_available) : [];
    this.preferredActivities = fitnessData.preferred_activities ? 
      JSON.parse(fitnessData.preferred_activities) : [];
    this.injuriesOrLimitations = fitnessData.injuries_or_limitations;
    this.coachingStyle = fitnessData.coaching_style;
    this.updatedAt = fitnessData.updated_at;
  }

  // Create or update fitness preferences for a user
  static async createOrUpdate(userId, fitnessData) {
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
      return new Fitness(result.rows[0]);
    } catch (error) {
      throw new Error(`Error creating/updating fitness preferences: ${error.message}`);
    }
  }

  // Find fitness preferences by user ID
  static async findByUserId(userId) {
    try {
      const query = 'SELECT * FROM fitness WHERE user_id = $1';
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Fitness(result.rows[0]);
    } catch (error) {
      throw new Error(`Error finding fitness preferences: ${error.message}`);
    }
  }

  // Update fitness preferences
  async update(updateData) {
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
      values.push(this.userId);

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

      // Update current instance
      Object.assign(this, new Fitness(result.rows[0]));
      return this;
    } catch (error) {
      throw new Error(`Error updating fitness preferences: ${error.message}`);
    }
  }

  // Delete fitness preferences
  async delete() {
    try {
      const query = 'DELETE FROM fitness WHERE user_id = $1';
      await pool.query(query, [this.userId]);
      return true;
    } catch (error) {
      throw new Error(`Error deleting fitness preferences: ${error.message}`);
    }
  }

  // Get recommended workout frequency based on experience level
  getRecommendedFrequency() {
    const recommendations = {
      'beginner': { min: 2, max: 3, sessionLength: 45 },
      'intermediate': { min: 3, max: 4, sessionLength: 60 },
      'advanced': { min: 4, max: 6, sessionLength: 75 }
    };

    return recommendations[this.experienceLevel] || recommendations['intermediate'];
  }

  // Get workout intensity recommendations
  getIntensityRecommendations() {
    const intensityLevels = {
      'beginner': ['low', 'moderate'],
      'intermediate': ['moderate', 'high'],
      'advanced': ['moderate', 'high', 'very_high']
    };

    return intensityLevels[this.experienceLevel] || intensityLevels['intermediate'];
  }

  // Check if user has specific equipment
  hasEquipment(equipment) {
    return this.equipmentAvailable.includes(equipment);
  }

  // Check if user prefers specific activity
  prefersActivity(activity) {
    return this.preferredActivities.includes(activity);
  }

  // Get workout recommendations based on fitness preferences
  getWorkoutRecommendations() {
    // Generate basic recommendations based on preferences
    const recommendations = {
      frequency: this.getRecommendedFrequency(),
      intensity: this.getIntensityRecommendations(),
      workoutTypes: [],
      tips: []
    };

    // Add workout type recommendations based on goal
    switch (this.goal) {
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

    return recommendations;
  }

  // Get formatted JSON response
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      goal: this.goal,
      activityLevel: this.activityLevel,
      experienceLevel: this.experienceLevel,
      daysPerWeek: this.daysPerWeek,
      sessionLengthMin: this.sessionLengthMin,
      trainingLocation: this.trainingLocation,
      equipmentAvailable: this.equipmentAvailable,
      preferredActivities: this.preferredActivities,
      injuriesOrLimitations: this.injuriesOrLimitations,
      coachingStyle: this.coachingStyle,
      updatedAt: this.updatedAt,
      recommendations: this.getWorkoutRecommendations()
    };
  }
}

module.exports = Fitness;