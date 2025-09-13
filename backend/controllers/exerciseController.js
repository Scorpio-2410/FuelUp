// controllers/exerciseController.js
const Exercise = require("../models/exercise");
const FitnessProfile = require("../models/fitnessProfile");

class ExerciseController {
  // POST /api/fitness/exercises
  static async create(req, res) {
    try {
      const userId = req.userId;
      const {
        fitnessProfileId,
        name,
        muscleGroup,
        equipment,
        difficulty,
        durationMin,
        sets,
        reps,
        restSeconds,
        notes,
      } = req.body;

      if (!fitnessProfileId || !name) {
        return res
          .status(400)
          .json({ error: "fitnessProfileId and name are required" });
      }

      const profile = await FitnessProfile.findById(fitnessProfileId);
      if (!profile || profile.userId !== userId) {
        return res.status(403).json({ error: "Invalid fitness profile" });
      }

      const ex = await Exercise.create({
        userId,
        fitnessProfileId,
        name,
        muscleGroup: muscleGroup || null,
        equipment: equipment || null,
        difficulty: difficulty || null,
        durationMin: durationMin || null,
        sets: sets || null,
        reps: reps || null,
        restSeconds: restSeconds || null,
        notes: notes || null,
      });

      res.status(201).json({ success: true, exercise: ex.toJSON() });
    } catch (e) {
      console.error("Exercise create error:", e);
      res.status(500).json({ error: "Failed to create exercise" });
    }
  }

  // GET /api/fitness/exercises?profileId=&limit=&offset=
  static async list(req, res) {
    try {
      const { profileId, limit = 100, offset = 0 } = req.query;
      if (profileId) {
        const profile = await FitnessProfile.findById(profileId);
        if (!profile || profile.userId !== req.userId) {
          return res.status(403).json({ error: "Invalid fitness profile" });
        }
        const items = await Exercise.listByProfile(profileId, {
          limit: +limit,
          offset: +offset,
        });
        return res.json({
          success: true,
          exercises: items.map((x) => x.toJSON()),
          pagination: { limit: +limit, offset: +offset },
        });
      }
      const items = await Exercise.listByUser(req.userId, {
        limit: +limit,
        offset: +offset,
      });
      res.json({
        success: true,
        exercises: items.map((x) => x.toJSON()),
        pagination: { limit: +limit, offset: +offset },
      });
    } catch (e) {
      console.error("Exercise list error:", e);
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  }

  // PUT /api/fitness/exercises/:id
  static async update(req, res) {
    try {
      const ex = await Exercise.findById(req.params.id);
      if (!ex || ex.userId !== req.userId) {
        return res.status(404).json({ error: "Exercise not found" });
      }
      const updated = await ex.update(req.body);
      res.json({ success: true, exercise: updated.toJSON() });
    } catch (e) {
      console.error("Exercise update error:", e);
      res.status(500).json({ error: "Failed to update exercise" });
    }
  }

  // DELETE /api/fitness/exercises/:id
  static async remove(req, res) {
    try {
      const ex = await Exercise.findById(req.params.id);
      if (!ex || ex.userId !== req.userId) {
        return res.status(404).json({ error: "Exercise not found" });
      }
      await ex.delete();
      res.json({ success: true });
    } catch (e) {
      console.error("Exercise delete error:", e);
      res.status(500).json({ error: "Failed to delete exercise" });
    }
  }
}

module.exports = ExerciseController;
