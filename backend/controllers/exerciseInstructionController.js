const ExerciseInstruction = require("../models/exerciseInstruction");
const Exercise = require("../models/exercise");
const FitnessPlan = require("../models/fitnessPlan");

// Prefer single-query ownership if available; fallback to existing 2-query flow
async function assertExerciseOwnership(exerciseId, userId) {
  if (typeof Exercise.getById === "function") {
    const ex = await Exercise.getById(exerciseId, userId);
    if (!ex) return { error: "ForbiddenOrMissing" }; // unify not-found/forbidden
    return { exercise: ex, plan: { userId } };
  }
  const exercise = await Exercise.findById(exerciseId);
  if (!exercise) return { error: "Exercise not found" };
  const plan = await FitnessPlan.findById(exercise.fitnessPlanId);
  if (!plan || plan.userId !== userId) return { error: "Forbidden" };
  return { exercise, plan };
}

// GET /api/exercises/:id/instructions?lang=en
async function getByExercise(req, res) {
  try {
    const exerciseId = Number(req.params.id);
    const lang = req.query.lang;
    const { error, exercise } = await assertExerciseOwnership(exerciseId, req.userId);
    if (error) return res.status(error === "Exercise not found" ? 404 : 403).json({ error });

    const result = await ExerciseInstruction.findByExercise(exercise.id, { language: lang });
    const payload = Array.isArray(result)
      ? result.map(r => r.toJSON())
      : (result ? result.toJSON() : null);

    return res.json({ success: true, instructions: payload });
  } catch (e) {
    console.error("getByExercise error:", e);
    return res.status(500).json({ error: "Failed to fetch instructions" });
  }
}

// POST /api/exercises/:id/instructions  (idempotent: create or update by language)
async function create(req, res) {
  try {
    const exerciseId = Number(req.params.id);
    const { error, exercise } = await assertExerciseOwnership(exerciseId, req.userId);
    if (error) return res.status(error === "Exercise not found" ? 404 : 403).json({ error });

    const saved = await ExerciseInstruction.upsert(exercise.id, {
      stepsMd: req.body.stepsMd,
      tipsMd: req.body.tipsMd,
      videoUrl: req.body.videoUrl,
      videoSources: req.body.videoSources,
      format: req.body.format,
      language: req.body.language,
    });

    return res.status(201).json({ success: true, instruction: saved.toJSON() });
  } catch (e) {
    console.error("createInstruction error:", e);
    return res.status(500).json({ error: "Failed to save instruction" });
  }
}

// PUT /api/exercise-instructions/:instructionId
async function update(req, res) {
  try {
    const instr = await ExerciseInstruction.findById(Number(req.params.instructionId));
    if (!instr) return res.status(404).json({ error: "Instruction not found" });

    const { error } = await assertExerciseOwnership(instr.exerciseId, req.userId);
    if (error) return res.status(error === "Exercise not found" ? 404 : 403).json({ error });

    const updated = await instr.update({
      stepsMd: req.body.stepsMd,
      tipsMd: req.body.tipsMd,
      videoUrl: req.body.videoUrl,
      videoSources: req.body.videoSources,
      format: req.body.format,
      language: req.body.language,
    });

    return res.json({ success: true, instruction: updated.toJSON() });
  } catch (e) {
    console.error("updateInstruction error:", e);
    return res.status(500).json({ error: "Failed to update instruction" });
  }
}

// DELETE /api/exercise-instructions/:instructionId
async function remove(req, res) {
  try {
    const instr = await ExerciseInstruction.findById(Number(req.params.instructionId));
    if (!instr) return res.status(404).json({ error: "Instruction not found" });

    const { error } = await assertExerciseOwnership(instr.exerciseId, req.userId);
    if (error) return res.status(error === "Exercise not found" ? 404 : 403).json({ error });

    await instr.delete();
    return res.json({ success: true });
  } catch (e) {
    console.error("deleteInstruction error:", e);
    return res.status(500).json({ error: "Failed to delete instruction" });
  }
}

// OPTIONAL: DELETE by (exerciseId, lang) to match your unique index directly
// DELETE /api/exercises/:id/instructions?lang=en
async function deleteForExerciseLang(req, res) {
  try {
    const exerciseId = Number(req.params.id);
    const lang = (req.query.lang || "en").slice(0, 10);

    const { error, exercise } = await assertExerciseOwnership(exerciseId, req.userId);
    if (error) return res.status(error === "Exercise not found" ? 404 : 403).json({ error });

    // Reuse model; simple helper inline
    const row = await ExerciseInstruction.findByExercise(exercise.id, { language: lang });
    if (!row) return res.status(404).json({ error: "Instruction not found for language" });

    await row.delete();
    return res.json({ success: true });
  } catch (e) {
    console.error("deleteForExerciseLang error:", e);
    return res.status(500).json({ error: "Failed to delete instruction" });
  }
}

module.exports = {
  getByExercise,
  create,
  update,
  remove,
  deleteForExerciseLang, // optional export
};
