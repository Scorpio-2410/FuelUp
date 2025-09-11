const Fitness = require('../models/Fitness');

class FitnessController {
  // Get fitness preferences for a user
  static async getFitnessPreferences(req, res) {
    try {
      const userId = req.userId;

      const fitnessPrefs = await Fitness.findByUserId(userId);
      
      if (!fitnessPrefs) {
        return res.status(404).json({
          error: 'Fitness preferences not found',
          message: 'User has not set up fitness preferences yet'
        });
      }

      res.json({
        success: true,
        data: fitnessPrefs.toJSON()
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

      const fitnessPrefs = await Fitness.createOrUpdate(userId, fitnessData);

      res.status(201).json({
        success: true,
        message: 'Fitness preferences saved successfully',
        data: fitnessPrefs.toJSON()
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
      const existingPrefs = await Fitness.findByUserId(userId);
      if (!existingPrefs) {
        return res.status(404).json({
          error: 'Fitness preferences not found',
          message: 'Please create fitness preferences first'
        });
      }

      // Update the preferences
      const updatedPrefs = await existingPrefs.update(updateData);

      res.json({
        success: true,
        message: 'Fitness preferences updated successfully',
        data: updatedPrefs.toJSON()
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

      const fitnessPrefs = await Fitness.findByUserId(userId);
      if (!fitnessPrefs) {
        return res.status(404).json({
          error: 'Fitness preferences not found'
        });
      }

      await fitnessPrefs.delete();

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

      const fitnessPrefs = await Fitness.findByUserId(userId);
      if (!fitnessPrefs) {
        return res.status(404).json({
          error: 'Fitness preferences not found',
          message: 'Please set up your fitness preferences first'
        });
      }

      const recommendations = fitnessPrefs.getWorkoutRecommendations();

      res.json({
        success: true,
        data: {
          userPreferences: fitnessPrefs.toJSON(),
          recommendations
        }
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