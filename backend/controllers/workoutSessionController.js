// backend/controllers/workoutSessionController.js
const WorkoutSession = require("../models/workoutSession");

const WorkoutSessionController = {
  // Create a new workout session (called when user finishes a workout)
  async createSession(req, res) {
    try {
      const {
        workout_name,
        plan_id,
        event_id,
        duration_seconds,
        completed_at,
        exercises_completed,
        total_exercises,
        notes,
      } = req.body;

      if (!workout_name) {
        return res.status(400).json({ error: "Workout name is required" });
      }

      if (duration_seconds === undefined || duration_seconds === null) {
        return res.status(400).json({ error: "Duration is required" });
      }

      const session = await WorkoutSession.create({
        userId: req.userId,
        workoutName: workout_name,
        planId: plan_id,
        eventId: event_id,
        durationSeconds: duration_seconds,
        completedAt: completed_at,
        exercisesCompleted: exercises_completed,
        totalExercises: total_exercises,
        notes,
      });

      res.status(201).json({ success: true, session });
    } catch (e) {
      console.error("createSession error:", e);
      res.status(500).json({ error: "Failed to create workout session" });
    }
  },

  // Get all sessions for the current user
  async listSessions(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const sessions = await WorkoutSession.findByUserId(req.userId, {
        limit,
        offset,
      });

      res.json({ success: true, sessions });
    } catch (e) {
      console.error("listSessions error:", e);
      res.status(500).json({ error: "Failed to list workout sessions" });
    }
  },

  // Get a specific session by ID
  async getSession(req, res) {
    try {
      const session = await WorkoutSession.findById(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Verify ownership
      if (session.userId !== req.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      res.json({ success: true, session });
    } catch (e) {
      console.error("getSession error:", e);
      res.status(500).json({ error: "Failed to fetch workout session" });
    }
  },

  // Get user's current streak
  async getStreak(req, res) {
    try {
      const streak = await WorkoutSession.getStreak(req.userId);
      const total = await WorkoutSession.getTotalWorkouts(req.userId);

      res.json({ success: true, streak, total_workouts: total });
    } catch (e) {
      console.error("getStreak error:", e);
      res.status(500).json({ error: "Failed to fetch streak" });
    }
  },

  // Get sessions within a date range
  async getSessionsByDateRange(req, res) {
    try {
      const { from, to } = req.query;

      if (!from || !to) {
        return res
          .status(400)
          .json({ error: "Both 'from' and 'to' dates are required" });
      }

      const sessions = await WorkoutSession.getWorkoutsByDateRange(
        req.userId,
        from,
        to
      );

      res.json({ success: true, sessions });
    } catch (e) {
      console.error("getSessionsByDateRange error:", e);
      res.status(500).json({ error: "Failed to fetch workout sessions" });
    }
  },

  // Update a session
  async updateSession(req, res) {
    try {
      const session = await WorkoutSession.findById(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Verify ownership
      if (session.userId !== req.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const updated = await session.update(req.body);
      res.json({ success: true, session: updated });
    } catch (e) {
      console.error("updateSession error:", e);
      res.status(500).json({ error: "Failed to update workout session" });
    }
  },

  // Delete a session
  async deleteSession(req, res) {
    try {
      const session = await WorkoutSession.findById(req.params.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Verify ownership
      if (session.userId !== req.userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await session.delete();
      res.json({ success: true });
    } catch (e) {
      console.error("deleteSession error:", e);
      res.status(500).json({ error: "Failed to delete workout session" });
    }
  },
};

module.exports = WorkoutSessionController;
