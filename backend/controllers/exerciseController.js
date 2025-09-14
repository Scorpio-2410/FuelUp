// backend/controllers/exerciseController.js
const Exercise = require("../models/exercise");

const ExerciseController = {
  async listExercises(req, res) {
    try {
      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);
      const exercises = await Exercise.listForUser(req.userId, {
        limit,
        offset,
      });
      res.json({ success: true, exercises, pagination: { limit, offset } });
    } catch (e) {
      console.error("listExercises error:", e);
      res.status(500).json({ error: "Failed to list exercises" });
    }
  },

  async getExerciseById(req, res) {
    try {
      const id = Number(req.params.id);
      const exercise = await Exercise.getById(id, req.userId);
      if (!exercise)
        return res.status(404).json({ error: "Exercise not found" });
      res.json({ success: true, exercise });
    } catch (e) {
      console.error("getExerciseById error:", e);
      res.status(500).json({ error: "Failed to fetch exercise" });
    }
  },

  async createExercise(req, res) {
    try {
      const created = await Exercise.create(req.userId, {
        name: req.body.name,
        muscle_group: req.body.muscleGroup ?? null,
        equipment: req.body.equipment ?? null,
        difficulty: req.body.difficulty ?? null,
        duration_min: req.body.durationMin ?? null,
        sets: req.body.sets ?? null,
        reps: req.body.reps ?? null,
        rest_seconds: req.body.restSeconds ?? null,
        notes: req.body.notes ?? null,
      });
      res.status(201).json({ success: true, exercise: created });
    } catch (e) {
      console.error("createExercise error:", e);
      res.status(500).json({ error: "Failed to create exercise" });
    }
  },

  async updateExercise(req, res) {
    try {
      const id = Number(req.params.id);
      const updated = await Exercise.update(id, req.userId, {
        name: req.body.name,
        muscle_group: req.body.muscleGroup,
        equipment: req.body.equipment,
        difficulty: req.body.difficulty,
        duration_min: req.body.durationMin,
        sets: req.body.sets,
        reps: req.body.reps,
        rest_seconds: req.body.restSeconds,
        notes: req.body.notes,
      });
      if (!updated)
        return res.status(404).json({ error: "Exercise not found" });
      res.json({ success: true, exercise: updated });
    } catch (e) {
      console.error("updateExercise error:", e);
      res.status(500).json({ error: "Failed to update exercise" });
    }
  },

  async deleteExercise(req, res) {
    try {
      const id = Number(req.params.id);
      const ok = await Exercise.remove(id, req.userId);
      if (!ok) return res.status(404).json({ error: "Exercise not found" });
      res.json({ success: true });
    } catch (e) {
      console.error("deleteExercise error:", e);
      res.status(500).json({ error: "Failed to delete exercise" });
    }
  },
};

module.exports = ExerciseController;
