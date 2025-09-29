// backend/controllers/exerciseController.js
const Exercise = require("../models/exercise");

const ExerciseController = {
  async listExercises(req, res) {
    try {
      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
      
      const exercises = await Exercise.listAll({
        limit,
        offset,
        categoryId,
      });
      res.json({ 
        success: true, 
        exercises: exercises.map(e => e.toJSON()), 
        pagination: { limit, offset, categoryId } 
      });
    } catch (e) {
      console.error("listExercises error:", e);
      res.status(500).json({ error: "Failed to list exercises" });
    }
  },

  async getExerciseById(req, res) {
    try {
      const id = Number(req.params.id);
      const exercise = await Exercise.getById(id);
      if (!exercise)
        return res.status(404).json({ error: "Exercise not found" });
      res.json({ success: true, exercise: exercise.toJSON() });
    } catch (e) {
      console.error("getExerciseById error:", e);
      res.status(500).json({ error: "Failed to fetch exercise" });
    }
  },

  async createExercise(req, res) {
    try {
      // Exercises are now global and don't require a fitness plan
      if (!req.body.name) {
        return res.status(400).json({ 
          error: "Exercise name is required." 
        });
      }

      const created = await Exercise.create({
        name: req.body.name,
        categoryId: req.body.categoryId ?? null,
        muscleGroup: req.body.muscleGroup ?? null,
        equipment: req.body.equipment ?? null,
        difficulty: req.body.difficulty ?? null,
        durationMin: req.body.durationMin ?? null,
        sets: req.body.sets ?? null,
        reps: req.body.reps ?? null,
        restSeconds: req.body.restSeconds ?? null,
        notes: req.body.notes ?? null,
      });
      res.status(201).json({ success: true, exercise: created.toJSON() });
    } catch (e) {
      console.error("createExercise error:", e);
      res.status(500).json({ error: "Failed to create exercise" });
    }
  },

  async updateExercise(req, res) {
    try {
      const id = Number(req.params.id);
      const updated = await Exercise.update(id, {
        name: req.body.name,
        category_id: req.body.categoryId,
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
      res.json({ success: true, exercise: updated.toJSON() });
    } catch (e) {
      console.error("updateExercise error:", e);
      res.status(500).json({ error: "Failed to update exercise" });
    }
  },

  async deleteExercise(req, res) {
    try {
      const id = Number(req.params.id);
      const ok = await Exercise.remove(id);
      if (!ok) return res.status(404).json({ error: "Exercise not found" });
      res.json({ success: true });
    } catch (e) {
      console.error("deleteExercise error:", e);
      res.status(500).json({ error: "Failed to delete exercise" });
    }
  },
};

module.exports = ExerciseController;
