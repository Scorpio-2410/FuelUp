// controllers/nutritionController.js
const NutritionProfile = require("../models/nutritionProfile");

class NutritionController {
  // GET /api/nutrition/profile
  static async getProfile(req, res) {
    try {
      let profile = await NutritionProfile.findByUserId(req.userId);
      if (!profile) profile = await NutritionProfile.upsert(req.userId, {});
      res.json({
        success: true,
        profile: profile.toJSON ? profile.toJSON() : profile,
      });
    } catch (e) {
      console.error("nutrition.getProfile error:", e);
      res.status(500).json({ error: "Failed to retrieve nutrition profile" });
    }
  }

  // PUT /api/nutrition/profile (upsert)
  static async upsertProfile(req, res) {
    try {
      const { dailyCalorieTarget, macros, prefCuisines, dietRestrictions } =
        req.body;

      const profile = await NutritionProfile.upsert(req.userId, {
        dailyCalorieTarget,
        macros,
        prefCuisines,
        dietRestrictions,
      });

      res.status(201).json({ success: true, profile: profile.toJSON() });
    } catch (e) {
      console.error("nutrition.upsertProfile error:", e);
      res.status(500).json({ error: "Failed to save nutrition profile" });
    }
  }

  // PATCH /api/nutrition/profile
  static async updateProfile(req, res) {
    try {
      const profile = await NutritionProfile.findByUserId(req.userId);
      if (!profile)
        return res.status(404).json({ error: "Nutrition profile not found" });

      const updated = await profile.update(req.body);
      res.json({ success: true, profile: updated.toJSON() });
    } catch (e) {
      console.error("nutrition.updateProfile error:", e);
      res.status(500).json({ error: "Failed to update nutrition profile" });
    }
  }
}

module.exports = NutritionController;
