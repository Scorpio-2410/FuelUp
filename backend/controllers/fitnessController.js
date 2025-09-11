const Fitness = require('../models/Fitness');

class FitnessController {
  // Create a new exercise entry
  static async createExercise(req, res) {
    try {
      const { 
        exerciseName, 
        exerciseType, 
        durationMinutes, 
        caloriesBurned, 
        sets, 
        reps, 
        weightUsed,
        distance,
        distanceUnit,
        intensity,
        exerciseDate,
        notes 
      } = req.body;

      // Validate required fields
      if (!exerciseName || !exerciseType || !exerciseDate) {
        return res.status(400).json({
          error: 'Exercise name, type, and date are required'
        });
      }

      // Validate exercise type
      if (!Fitness.validateExerciseType(exerciseType)) {
        return res.status(400).json({
          error: 'Invalid exercise type. Must be cardio, strength, flexibility, or sports'
        });
      }

      // Validate intensity if provided
      if (intensity && !Fitness.validateIntensity(intensity)) {
        return res.status(400).json({
          error: 'Invalid intensity level. Must be low, moderate, or high'
        });
      }

      const exerciseData = {
        userId: req.userId,
        exerciseName,
        exerciseType,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
        caloriesBurned: caloriesBurned ? parseFloat(caloriesBurned) : null,
        sets: sets ? parseInt(sets) : null,
        reps: reps ? parseInt(reps) : null,
        weightUsed: weightUsed ? parseFloat(weightUsed) : null,
        distance: distance ? parseFloat(distance) : null,
        distanceUnit: distanceUnit || 'km',
        intensity,
        exerciseDate,
        notes
      };

      const exercise = await Fitness.create(exerciseData);

      res.status(201).json({
        message: 'Exercise logged successfully',
        exercise
      });
    } catch (error) {
      console.error('Create exercise error:', error);
      res.status(500).json({
        error: 'Internal server error while creating exercise'
      });
    }
  }

  // Get exercises for a user (with pagination)
  static async getUserExercises(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      
      const exercises = await Fitness.findByUserId(
        req.userId, 
        parseInt(limit), 
        parseInt(offset)
      );

      res.json({
        exercises,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: exercises.length === parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get user exercises error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching exercises'
      });
    }
  }

  // Get exercises for a specific date
  static async getExercisesByDate(req, res) {
    try {
      const { date } = req.params;

      if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      const exercises = await Fitness.findByUserAndDate(req.userId, date);

      res.json({
        date,
        exercises
      });
    } catch (error) {
      console.error('Get exercises by date error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching exercises'
      });
    }
  }

  // Get exercises within a date range
  static async getExercisesByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Start date and end date are required'
        });
      }

      if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/) || !endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      const exercises = await Fitness.findByDateRange(req.userId, startDate, endDate);

      res.json({
        startDate,
        endDate,
        exercises
      });
    } catch (error) {
      console.error('Get exercises by date range error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching exercises'
      });
    }
  }

  // Get exercises by type
  static async getExercisesByType(req, res) {
    try {
      const { type } = req.params;
      const { limit = 20 } = req.query;

      if (!Fitness.validateExerciseType(type)) {
        return res.status(400).json({
          error: 'Invalid exercise type. Must be cardio, strength, flexibility, or sports'
        });
      }

      const exercises = await Fitness.findByType(req.userId, type, parseInt(limit));

      res.json({
        exerciseType: type,
        exercises
      });
    } catch (error) {
      console.error('Get exercises by type error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching exercises by type'
      });
    }
  }

  // Update an exercise
  static async updateExercise(req, res) {
    try {
      const { id } = req.params;
      
      const exercise = await Fitness.findById(id);
      
      if (!exercise) {
        return res.status(404).json({
          error: 'Exercise not found'
        });
      }

      // Check if exercise belongs to the authenticated user
      if (exercise.userId !== req.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      // Validate exercise type if provided
      if (req.body.exerciseType && !Fitness.validateExerciseType(req.body.exerciseType)) {
        return res.status(400).json({
          error: 'Invalid exercise type. Must be cardio, strength, flexibility, or sports'
        });
      }

      // Validate intensity if provided
      if (req.body.intensity && !Fitness.validateIntensity(req.body.intensity)) {
        return res.status(400).json({
          error: 'Invalid intensity level. Must be low, moderate, or high'
        });
      }

      const updatedExercise = await exercise.update(req.body);

      res.json({
        message: 'Exercise updated successfully',
        exercise: updatedExercise
      });
    } catch (error) {
      console.error('Update exercise error:', error);
      res.status(500).json({
        error: 'Internal server error while updating exercise'
      });
    }
  }

  // Delete an exercise
  static async deleteExercise(req, res) {
    try {
      const { id } = req.params;
      
      const exercise = await Fitness.findById(id);
      
      if (!exercise) {
        return res.status(404).json({
          error: 'Exercise not found'
        });
      }

      // Check if exercise belongs to the authenticated user
      if (exercise.userId !== req.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      await exercise.delete();

      res.json({
        message: 'Exercise deleted successfully'
      });
    } catch (error) {
      console.error('Delete exercise error:', error);
      res.status(500).json({
        error: 'Internal server error while deleting exercise'
      });
    }
  }

  // Get daily exercise summary
  static async getDailyExerciseSummary(req, res) {
    try {
      const { date } = req.params;

      if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      const summary = await Fitness.getDailyExerciseSummary(req.userId, date);

      res.json({
        date,
        exerciseSummary: summary
      });
    } catch (error) {
      console.error('Get daily exercise summary error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching exercise summary'
      });
    }
  }

  // Get exercises grouped by type for a specific date
  static async getExercisesByTypeAndDate(req, res) {
    try {
      const { date } = req.params;

      if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      const exercisesByType = await Fitness.getExercisesByTypeAndDate(req.userId, date);

      res.json({
        date,
        exercisesByType
      });
    } catch (error) {
      console.error('Get exercises by type and date error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching exercises by type'
      });
    }
  }

  // Get weekly exercise statistics
  static async getWeeklyStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Start date and end date are required'
        });
      }

      if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/) || !endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      const weeklyStats = await Fitness.getWeeklyStats(req.userId, startDate, endDate);

      res.json({
        startDate,
        endDate,
        weeklyStats
      });
    } catch (error) {
      console.error('Get weekly stats error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching weekly stats'
      });
    }
  }

  // Get single exercise details
  static async getExercise(req, res) {
    try {
      const { id } = req.params;
      
      const exercise = await Fitness.findById(id);
      
      if (!exercise) {
        return res.status(404).json({
          error: 'Exercise not found'
        });
      }

      // Check if exercise belongs to the authenticated user
      if (exercise.userId !== req.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      // Add intensity score to the response
      const intensityScore = exercise.getIntensityScore();

      res.json({
        exercise,
        intensityScore
      });
    } catch (error) {
      console.error('Get exercise error:', error);
      res.status(500).json({
        error: 'Internal server error while fetching exercise'
      });
    }
  }

  // FITNESS PREFERENCES METHODS

  // Get fitness preferences for a user
  static async getFitnessPreferences(req, res) {
    try {
      const userId = req.userId;

      const fitnessPrefs = await Fitness.getFitnessPreferences(userId);
      
      if (!fitnessPrefs) {
        return res.status(404).json({
          error: 'Fitness preferences not found',
          message: 'User has not set up fitness preferences yet'
        });
      }

      res.json({
        success: true,
        data: fitnessPrefs
      });
    } catch (error) {
      console.error('Get fitness preferences error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve fitness preferences'
      });
    }
  }

  // Create or update fitness preferences
  static async createOrUpdateFitnessPreferences(req, res) {
    try {
      const userId = req.userId;
      const {
        goal,
        activityLevel,
        experienceLevel,
        daysPerWeek,
        sessionLengthMin,
        trainingLocation,
        equipmentAvailable,
        preferredActivities,
        injuriesOrLimitations,
        coachingStyle
      } = req.body;

      // Validate required fields
      if (!goal || !activityLevel || !experienceLevel) {
        return res.status(400).json({
          error: 'Goal, activity level, and experience level are required'
        });
      }

      // Validate enum values
      const validGoals = ['weight_loss', 'muscle_gain', 'endurance', 'general_health', 'strength', 'flexibility'];
      const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
      const validExperienceLevels = ['beginner', 'intermediate', 'advanced'];
      const validCoachingStyles = ['motivational', 'instructional', 'flexible', 'strict'];

      if (!validGoals.includes(goal)) {
        return res.status(400).json({
          error: 'Invalid goal',
          validOptions: validGoals
        });
      }

      if (!validActivityLevels.includes(activityLevel)) {
        return res.status(400).json({
          error: 'Invalid activity level',
          validOptions: validActivityLevels
        });
      }

      if (!validExperienceLevels.includes(experienceLevel)) {
        return res.status(400).json({
          error: 'Invalid experience level',
          validOptions: validExperienceLevels
        });
      }

      if (coachingStyle && !validCoachingStyles.includes(coachingStyle)) {
        return res.status(400).json({
          error: 'Invalid coaching style',
          validOptions: validCoachingStyles
        });
      }

      // Validate numeric fields
      if (daysPerWeek && (daysPerWeek < 1 || daysPerWeek > 7)) {
        return res.status(400).json({
          error: 'Days per week must be between 1 and 7'
        });
      }

      if (sessionLengthMin && (sessionLengthMin < 15 || sessionLengthMin > 180)) {
        return res.status(400).json({
          error: 'Session length must be between 15 and 180 minutes'
        });
      }

      const fitnessData = {
        goal,
        activityLevel,
        experienceLevel,
        daysPerWeek,
        sessionLengthMin,
        trainingLocation,
        equipmentAvailable: Array.isArray(equipmentAvailable) ? equipmentAvailable : [],
        preferredActivities: Array.isArray(preferredActivities) ? preferredActivities : [],
        injuriesOrLimitations,
        coachingStyle
      };

      const fitnessPrefs = await Fitness.createOrUpdateFitnessPreferences(userId, fitnessData);

      res.status(201).json({
        success: true,
        message: 'Fitness preferences saved successfully',
        data: fitnessPrefs
      });
    } catch (error) {
      console.error('Create/Update fitness preferences error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to save fitness preferences'
      });
    }
  }

  // Update specific fitness preferences
  static async updateFitnessPreferences(req, res) {
    try {
      const userId = req.userId;
      const updateData = req.body;

      // Find existing fitness preferences
      const existingPrefs = await Fitness.getFitnessPreferences(userId);
      if (!existingPrefs) {
        return res.status(404).json({
          error: 'Fitness preferences not found',
          message: 'Please create fitness preferences first'
        });
      }

      // Update the preferences
      const updatedPrefs = await Fitness.updateFitnessPreferences(userId, updateData);

      res.json({
        success: true,
        message: 'Fitness preferences updated successfully',
        data: updatedPrefs
      });
    } catch (error) {
      console.error('Update fitness preferences error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update fitness preferences'
      });
    }
  }

  // Delete fitness preferences
  static async deleteFitnessPreferences(req, res) {
    try {
      const userId = req.userId;

      const fitnessPrefs = await Fitness.getFitnessPreferences(userId);
      if (!fitnessPrefs) {
        return res.status(404).json({
          error: 'Fitness preferences not found'
        });
      }

      await Fitness.deleteFitnessPreferences(userId);

      res.json({
        success: true,
        message: 'Fitness preferences deleted successfully'
      });
    } catch (error) {
      console.error('Delete fitness preferences error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete fitness preferences'
      });
    }
  }

  // Get workout recommendations based on fitness preferences
  static async getWorkoutRecommendations(req, res) {
    try {
      const userId = req.userId;

      const recommendations = await Fitness.getWorkoutRecommendations(userId);
      if (!recommendations) {
        return res.status(404).json({
          error: 'Fitness preferences not found',
          message: 'Please set up your fitness preferences first'
        });
      }

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      console.error('Get workout recommendations error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to generate workout recommendations'
      });
    }
  }

  // Get available equipment and activity options
  static async getEquipmentOptions(req, res) {
    try {
      const equipmentOptions = [
        'dumbbells',
        'barbell',
        'resistance_bands',
        'kettlebells',
        'pull_up_bar',
        'yoga_mat',
        'treadmill',
        'stationary_bike',
        'rowing_machine',
        'cable_machine',
        'smith_machine',
        'bench',
        'stability_ball',
        'foam_roller',
        'medicine_ball',
        'battle_ropes',
        'suspension_trainer',
        'none'
      ];

      const activityOptions = [
        'weightlifting',
        'cardio',
        'yoga',
        'pilates',
        'running',
        'cycling',
        'swimming',
        'hiking',
        'dancing',
        'martial_arts',
        'rock_climbing',
        'team_sports',
        'calisthenics',
        'crossfit',
        'stretching',
        'meditation'
      ];

      res.json({
        success: true,
        data: {
          equipment: equipmentOptions,
          activities: activityOptions,
          goals: ['weight_loss', 'muscle_gain', 'endurance', 'general_health', 'strength', 'flexibility'],
          activityLevels: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
          experienceLevels: ['beginner', 'intermediate', 'advanced'],
          coachingStyles: ['motivational', 'instructional', 'flexible', 'strict']
        }
      });
    } catch (error) {
      console.error('Get equipment options error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve equipment options'
      });
    }
  }
}

module.exports = FitnessController;
