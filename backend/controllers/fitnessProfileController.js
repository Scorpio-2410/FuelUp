// controllers/fitnessProfileController.js
const FitnessProfile = require("../models/fitnessProfile");

class FitnessProfileController {
  // GET /api/fitness/profile
  static async getMyProfile(req, res) {
    try {
      const p = await FitnessProfile.findByUserId(req.userId);
      if (!p) return res.status(404).json({ error: "Profile not found" });
      res.json({ success: true, profile: p.toJSON() });
    } catch (e) {
      console.error("getMyProfile error:", e);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  }

  // PUT /api/fitness/profile  (create or update - upsert)
  static async upsertMyProfile(req, res) {
    try {
      const data = {
        heightCm: req.body.heightCm ?? null,
        weightKg: req.body.weightKg ?? null,
        goal: req.body.goal || "general_health",
        activityLevel: req.body.activityLevel || "moderate",
        daysPerWeek: req.body.daysPerWeek ?? null,
      };

      const profile = await FitnessProfile.upsert(req.userId, data);
      res.status(201).json({ success: true, profile: profile.toJSON() });
    } catch (e) {
      console.error("upsertMyProfile error:", e);
      res.status(500).json({ error: "Failed to save profile" });
    }
  }

  // PATCH /api/fitness/profile (optional)
  static async updateMyProfile(req, res) {
    try {
      const profile = await FitnessProfile.findByUserId(req.userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const allowed = [
        "heightCm",
        "weightKg",
        "goal",
        "activityLevel",
        "daysPerWeek",
      ];

      const patch = {};
      for (const k of allowed) {
        if (Object.prototype.hasOwnProperty.call(req.body, k)) {
          patch[k] = req.body[k];
        }
      }

      const updated = await profile.update(patch);
      res.json({ success: true, profile: updated.toJSON() });
    } catch (e) {
      console.error("updateMyProfile error:", e);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
}

module.exports = FitnessProfileController;