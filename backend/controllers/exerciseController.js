// controllers/exerciseController.js
const Exercise = require('../models/Exercise');
const Fitness = require('../models/Fitness');

class ExerciseController {
  // ---------- CREATE ----------
  static async createExercise(req, res) {
    try {
      const { name, description, videoUrl, muscleGroup, equipmentRequired, difficulty, isBodyweight } = req.body;

      if (!name || !muscleGroup || !difficulty) {
        return res.status(400).json({
          error: 'Name, muscle group, and difficulty are required'
        });
      }

      const exercise = await Exercise.create({
        name,
        description,
        videoUrl,
        muscleGroup,
        equipmentRequired,
        difficulty,
        isBodyweight
      });

      res.status(201).json({
        message: 'Exercise created successfully',
        exercise: exercise.toJSON()
      });
    } catch (error) {
      console.error('Create exercise error:', error);
      res.status(500).json({ error: 'Internal server error while creating exercise' });
    }
  }

  // ---------- READ ----------
  static async getExercise(req, res) {
    try {
      const { id } = req.params;
      const exercise = await Exercise.findById(id);

      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

      res.json({ exercise: exercise.toJSON() });
    } catch (error) {
      console.error('Get exercise error:', error);
      res.status(500).json({ error: 'Internal server error while fetching exercise' });
    }
  }

  static async listExercises(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const exercises = await Exercise.findAll(parseInt(limit), parseInt(offset));

      res.json({
        exercises: exercises.map(e => e.toJSON()),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: exercises.length === parseInt(limit)
        }
      });
    } catch (error) {
      console.error('List exercises error:', error);
      res.status(500).json({ error: 'Internal server error while fetching exercises' });
    }
  }

  // ---------- UPDATE ----------
  static async updateExercise(req, res) {
    try {
      const { id } = req.params;
      const exercise = await Exercise.findById(id);

      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

      const updated = await exercise.update(req.body);

      res.json({
        message: 'Exercise updated successfully',
        exercise: updated.toJSON()
      });
    } catch (error) {
      console.error('Update exercise error:', error);
      res.status(500).json({ error: 'Internal server error while updating exercise' });
    }
  }

  // ---------- DELETE ----------
  static async deleteExercise(req, res) {
    try {
      const { id } = req.params;
      const exercise = await Exercise.findById(id);

      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

      await exercise.delete();

      res.json({ message: 'Exercise deleted successfully' });
    } catch (error) {
      console.error('Delete exercise error:', error);
      res.status(500).json({ error: 'Internal server error while deleting exercise' });
    }
  }

  // ---------- DAILY PLAN ----------
  static async getDailyPlan(req, res) {
    try {
      const userId = req.userId;
      const mood = (req.query.mood || 'normal').toLowerCase(); // easy | normal | hard

      const fitnessPrefs = await Fitness.findByUserId(userId);
      if (!fitnessPrefs) {
        return res.status(404).json({
          error: 'Fitness preferences not found',
          message: 'Please set up your fitness preferences first'
        });
      }

      const { goal, daysPerWeek } = fitnessPrefs;
      const today = new Date().getDay(); // 0=Sun .. 6=Sat

      // Split logic (simplified)
      const split = daysPerWeek <= 3
        ? 'full_body'
        : (daysPerWeek === 4 ? (today % 2 === 0 ? 'upper' : 'lower') : ['push','pull','legs','core'][today % 4]);

      const difficultyMap = {
        easy: 'beginner',
        normal: 'intermediate',
        hard: 'advanced'
      };
      const difficulty = difficultyMap[mood] || 'intermediate';

      // Example volume (sets/reps)
      const volume = mood === 'easy'
        ? { sets: 2, reps: 12 }
        : mood === 'hard'
          ? { sets: 4, reps: 8 }
          : { sets: 3, reps: 10 };

      // Map split → muscle groups
      const muscleGroups = split === 'upper'
        ? ['push', 'pull']
        : split === 'lower'
          ? ['legs', 'core']
          : split === 'full_body'
            ? ['push', 'pull', 'legs', 'core']
            : [split];

      // Fetch exercises per group
      let exercises = [];
      for (const mg of muscleGroups) {
        const found = await Exercise.findByFilters({ goal, muscleGroup: mg, difficulty });
        exercises.push(...found.slice(0, 2)); // pick top 2 per group
      }

      res.json({
        date: new Date().toISOString().slice(0,10),
        split,
        intensity: mood,
        volume,
        exercises: exercises.map(e => ({
          id: e.id,
          name: e.name,
          description: e.description,
          videoUrl: e.videoUrl,
          muscleGroup: e.muscleGroup,
          difficulty: e.difficulty
        }))
      });
    } catch (error) {
      console.error('Get daily plan error:', error);
      res.status(500).json({ error: 'Internal server error while generating daily plan' });
    }
  }
}

module.exports = ExerciseController;
