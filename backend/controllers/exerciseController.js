// backend/controllers/exerciseController.js
const Exercise = require("../models/exercise");
const FitnessPlan = require("../models/fitnessPlan");

const ExerciseController = {
  async listExercises(req, res) {
    try {
      const limit = Number(req.query.limit ?? 50);
      const offset = Number(req.query.offset ?? 0);
      const exercises = await Exercise.listForUser(req.userId, { limit, offset });
      res.json({ success: true, exercises: exercises.map(e => e.toJSON ? e.toJSON() : e) });
    } catch (e) {
      console.error("listExercises error:", e);
      res.status(500).json({ error: "Failed to list exercises" });
    }
  },

  async getExerciseById(req, res) {
    try {
      const id = Number(req.params.id);
      const ex = await Exercise.getById(id, req.userId);
      if (!ex) return res.status(404).json({ error: "Exercise not found" });
      res.json({ success: true, exercise: ex.toJSON ? ex.toJSON() : ex });
    } catch (e) {
      console.error("getExerciseById error:", e);
      res.status(500).json({ error: "Failed to fetch exercise" });
    }
  },

  async createExercise(req, res) {
    try {
      const {
        planId, name, muscleGroup, equipment, difficulty,
        durationMin, sets, reps, restSeconds, notes
      } = req.body;

      if (!planId || !name) {
        return res.status(400).json({ error: "planId and name are required" });
      }

      const plan = await FitnessPlan.findById(Number(planId));
      if (!plan || plan.userId !== req.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // FIX: model signature is (planId, data). Pass planId first, data second.
      const ex = await Exercise.create(Number(planId), {
        name, muscleGroup, equipment, difficulty,
        durationMin, sets, reps, restSeconds, notes
      });

      res.status(201).json({ success: true, exercise: ex.toJSON ? ex.toJSON() : ex });
    } catch (e) {
      console.error("createExercise error:", e);
      res.status(500).json({ error: "Failed to create exercise" });
    }
  },

  async updateExercise(req, res) {
    try {
      const id = Number(req.params.id);
      const ex = await Exercise.getById(id, req.userId);
      if (!ex) return res.status(404).json({ error: "Exercise not found" });

      // FIX: model.update expects snake_case DB columns.
      const body = req.body || {};
      const patchDb = {};
      if (Object.prototype.hasOwnProperty.call(body, "name")) patchDb.name = body.name;
      if (Object.prototype.hasOwnProperty.call(body, "muscleGroup")) patchDb.muscle_group = body.muscleGroup;
      if (Object.prototype.hasOwnProperty.call(body, "equipment")) patchDb.equipment = body.equipment;
      if (Object.prototype.hasOwnProperty.call(body, "difficulty")) patchDb.difficulty = body.difficulty;
      if (Object.prototype.hasOwnProperty.call(body, "durationMin")) patchDb.duration_min = body.durationMin;
      if (Object.prototype.hasOwnProperty.call(body, "sets")) patchDb.sets = body.sets;
      if (Object.prototype.hasOwnProperty.call(body, "reps")) patchDb.reps = body.reps;
      if (Object.prototype.hasOwnProperty.call(body, "restSeconds")) patchDb.rest_seconds = body.restSeconds;
      if (Object.prototype.hasOwnProperty.call(body, "notes")) patchDb.notes = body.notes;

      const updated = await ex.update(patchDb);
      res.json({ success: true, exercise: updated.toJSON ? updated.toJSON() : updated });
    } catch (e) {
      console.error("updateExercise error:", e);
      res.status(500).json({ error: "Failed to update exercise" });
    }
  },

  async deleteExercise(req, res) {
    try {
      const id = Number(req.params.id);
      const ex = await Exercise.getById(id, req.userId);
      if (!ex) return res.status(404).json({ error: "Exercise not found" });

      await ex.delete();
      res.json({ success: true });
    } catch (e) {
      console.error("deleteExercise error:", e);
      res.status(500).json({ error: "Failed to delete exercise" });
    }
  },
};

module.exports = ExerciseController;
