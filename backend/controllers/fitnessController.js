// controllers/FitnessController.js
const Fitness = require("../models/Fitness");

class FitnessController {
  static async get(req, res) {
    try {
      const fitness = await Fitness.findByUserId(req.userId);
      if (!fitness) {
        return res.json({ success: true, data: null });
      }
      res.json({ success: true, data: fitness.toJSON() });
    } catch (e) {
      console.error("Fitness get error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async upsert(req, res) {
    try {
      const {
        goal,
        activityLevel,
        experienceLevel,
        daysPerWeek,
        sessionLengthMin,
        trainingLocation,
        equipmentAvailable,
        preferredActivities,
        injuriesOrLimitations,
        coachingStyle,
      } = req.body;

      // minimal validation
      const validGoals = [
        "weight_loss",
        "muscle_gain",
        "endurance",
        "general_health",
        "strength",
        "flexibility",
      ];
      if (goal && !validGoals.includes(goal)) {
        return res.status(400).json({ error: "Invalid goal" });
      }

      const fitness = await Fitness.upsert(req.userId, {
        goal,
        activityLevel,
        experienceLevel,
        daysPerWeek,
        sessionLengthMin,
        trainingLocation,
        equipmentAvailable: Array.isArray(equipmentAvailable)
          ? equipmentAvailable
          : undefined,
        preferredActivities: Array.isArray(preferredActivities)
          ? preferredActivities
          : undefined,
        injuriesOrLimitations,
        coachingStyle,
      });

      res.status(200).json({
        success: true,
        message: "Fitness preferences saved",
        data: fitness.toJSON(),
      });
    } catch (e) {
      console.error("Fitness upsert error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = FitnessController;
