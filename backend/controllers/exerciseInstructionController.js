// controllers/exerciseInstructionController.js
const ExerciseInstruction = require("../models/exerciseInstruction");
const Exercise = require("../models/exercise");
const FitnessPlan = require("../models/fitnessPlan");

// helper to enforce that the current user owns the parent exercise → plan
async function assertExerciseOwnership(exerciseId, userId) {
  const exercise = await Exercise.findById(exerciseId);
  if (!exercise) return { error: "Exercise not found" };

  const plan = await FitnessPlan.findById(exercise.fitnessPlanId);
  if (!plan || plan.userId !== userId) {
    return { error: "Forbidden" };
  }
  return { exercise, plan };
}

const ExerciseInstructionController = {
  // GET /api/exercises/:id/instructions?lang=en
  async getByExercise(req, res) {
    try {
      const { id } = req.params;
      const lang = req.query.lang;

      const { error, exercise } = await assertExerciseOwnership(Number(id), req.userId);
      if (error) {
        return res.status(error === "Forbidden" ? 403 : 404).json({ error });
      }

      const result = await ExerciseInstruction.findByExercise(exercise.id, { language: lang });
      res.json({ success: true, instructions: Array.isArray(result) ? result.map(r => r.toJSON()) : result ? result.toJSON() : null });
    } catch (e) {
      console.error("getByExercise error:", e);
      res.status(500).json({ error: "Failed to fetch instructions" });
    }
  },

  // POST /api/exercises/:id/instructions
  async create(req, res) {
    try {
      const { id } = req.params;
      const { error, exercise } = await assertExerciseOwnership(Number(id), req.userId);
      if (error) {
        return res.status(error === "Forbidden" ? 403 : 404).json({ error });
      }

      const created = await ExerciseInstruction.create(exercise.id, {
        stepsMd: req.body.stepsMd,
        tipsMd: req.body.tipsMd,
        videoUrl: req.body.videoUrl,
        videoSources: req.body.videoSources,
        format: req.body.format,
        language: req.body.language,
      });

      res.status(201).json({ success: true, instruction: created.toJSON() });
    } catch (e) {
      console.error("createInstruction error:", e);
      res.status(500).json({ error: "Failed to create instruction" });
    }
  },

  // PUT /api/exercise-instructions/:instructionId
  async update(req, res) {
    try {
      const { instructionId } = req.params;
      const instr = await ExerciseInstruction.findById(Number(instructionId));
      if (!instr) return res.status(404).json({ error: "Instruction not found" });

      // verify user owns the parent exercise → plan
      const { error } = await assertExerciseOwnership(instr.exerciseId, req.userId);
      if (error) {
        return res.status(error === "Forbidden" ? 403 : 404).json({ error });
      }

      const updated = await instr.update({
        stepsMd: req.body.stepsMd,
        tipsMd: req.body.tipsMd,
        videoUrl: req.body.videoUrl,
        videoSources: req.body.videoSources,
        format: req.body.format,
        language: req.body.language,
      });

      res.json({ success: true, instruction: updated.toJSON() });
    } catch (e) {
      console.error("updateInstruction error:", e);
      res.status(500).json({ error: "Failed to update instruction" });
    }
  },

  // DELETE /api/exercise-instructions/:instructionId
  async remove(req, res) {
    try {
      const { instructionId } = req.params;
      const instr = await ExerciseInstruction.findById(Number(instructionId));
      if (!instr) return res.status(404).json({ error: "Instruction not found" });

      const { error } = await assertExerciseOwnership(instr.exerciseId, req.userId);
      if (error) {
        return res.status(error === "Forbidden" ? 403 : 404).json({ error });
      }

      await instr.delete();
      res.json({ success: true });
    } catch (e) {
      console.error("deleteInstruction error:", e);
      res.status(500).json({ error: "Failed to delete instruction" });
    }
  },
};

module.exports = ExerciseInstructionController;
