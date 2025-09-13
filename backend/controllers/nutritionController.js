// controllers/NutritionController.js
const Nutrition = require("../models/Nutrition");

class NutritionController {
  static async getTargets(req, res) {
    try {
      const nt = await Nutrition.findByUserId(req.userId);
      res.json({
        success: true,
        targets: nt ? nt.toJSON() : null,
      });
    } catch (e) {
      console.error("Nutrition getTargets error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async setTargets(req, res) {
    try {
      const { dailyCalorieTarget, macros } = req.body;

      const nt = await Nutrition.upsert(req.userId, {
        dailyCalorieTarget,
        macros: macros || null,
      });

      res.json({
        success: true,
        message: "Nutrition targets saved",
        targets: nt.toJSON(),
      });
    } catch (e) {
      console.error("Nutrition setTargets error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = NutritionController;
