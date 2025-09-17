// backend/controllers/exerciseController.js
const Exercise = require("../models/exercise");
const FitnessPlan = require("../models/fitnessPlan");

async function assertPlanOwner(planId, userId) {
  const plan = await FitnessPlan.findById(planId);
  if (!plan || plan.userId !== userId) return null;
  return plan;
}

const ExerciseController = {
  async listExercises(req, res) {
    try {
      const planId = Number(req.query.planId);
      if (!planId) return res.status(400).json({ error: "planId is required" });
      const plan = await assertPlanOwner(planId, req.userId);
      if (!plan) return res.status(403).json({ error: "Forbidden" });
      const exercises = await Exercise.listByPlan(planId);
      res.json({ success: true, exercises: exercises.map(e => e.toJSON()) });
    } catch (e) {
      console.error("listExercises error:", e);
      res.status(500).json({ error: "Failed to list exercises" });
    }
  },

  async getExerciseById(req, res) {
    try {
      const exercise = await Exercise.findById(id);
      if (!exercise) return res.status(404).json({ error: "Exercise not found" });
      const plan = await assertPlanOwner(exercise.fitnessPlanId, req.userId);
      if (!plan) return res.status(403).json({ error: "Forbidden" });
      res.json({ success: true, exercise: exercise.toJSON() });
    } catch (e) {
      console.error("getExerciseById error:", e);
      res.status(500).json({ error: "Failed to fetch exercise" });
    }
  },

  async createExercise(req, res) {
    try {
      const planId = Number(req.body.planId);
      if (!planId) return res.status(400).json({ error: "planId is required" });
      const plan = await assertPlanOwner(planId, req.userId);
      if (!plan) return res.status(403).json({ error: "Forbidden" });

      const created = await Exercise.create(planId, {
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
      const exercise = await Exercise.findById(id);
      if (!exercise) return res.status(404).json({ error: "Exercise not found" });
      const plan = await assertPlanOwner(exercise.fitnessPlanId, req.userId);
      if (!plan) return res.status(403).json({ error: "Forbidden" });
      const updated = await exercise.update({
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
      res.json({ success: true, exercise: updated.toJSON() });
    } catch (e) {
      console.error("updateExercise error:", e);
      res.status(500).json({ error: "Failed to update exercise" });
    }
  },

  async deleteExercise(req, res) {
    try {
      const exercise = await Exercise.findById(id);
      if (!exercise) return res.status(404).json({ error: "Exercise not found" });
      const plan = await assertPlanOwner(exercise.fitnessPlanId, req.userId);
      if (!plan) return res.status(403).json({ error: "Forbidden" });
      await exercise.delete();
      res.json({ success: true });
    } catch (e) {
      console.error("deleteExercise error:", e);
      res.status(500).json({ error: "Failed to delete exercise" });
    }
  },
};

module.exports = ExerciseController;
