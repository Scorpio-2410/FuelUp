const Exercise = require('../models/Exercise');

class ExerciseController {
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
      if (!Exercise.validateExerciseType(exerciseType)) {
        return res.status(400).json({
          error: 'Invalid exercise type. Must be cardio, strength, flexibility, or sports'
        });
      }

      // Validate intensity if provided
      if (intensity && !Exercise.validateIntensity(intensity)) {
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

      const exercise = await Exercise.create(exerciseData);

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
      
      const exercises = await Exercise.findByUserId(
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

      const exercises = await Exercise.findByUserAndDate(req.userId, date);

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

      const exercises = await Exercise.findByDateRange(req.userId, startDate, endDate);

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

      if (!Exercise.validateExerciseType(type)) {
        return res.status(400).json({
          error: 'Invalid exercise type. Must be cardio, strength, flexibility, or sports'
        });
      }

      const exercises = await Exercise.findByType(req.userId, type, parseInt(limit));

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
      
      const exercise = await Exercise.findById(id);
      
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
      if (req.body.exerciseType && !Exercise.validateExerciseType(req.body.exerciseType)) {
        return res.status(400).json({
          error: 'Invalid exercise type. Must be cardio, strength, flexibility, or sports'
        });
      }

      // Validate intensity if provided
      if (req.body.intensity && !Exercise.validateIntensity(req.body.intensity)) {
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
      
      const exercise = await Exercise.findById(id);
      
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

      const summary = await Exercise.getDailyExerciseSummary(req.userId, date);

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

      const exercisesByType = await Exercise.getExercisesByTypeAndDate(req.userId, date);

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

      const weeklyStats = await Exercise.getWeeklyStats(req.userId, startDate, endDate);

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
      
      const exercise = await Exercise.findById(id);
      
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
}

module.exports = ExerciseController;
