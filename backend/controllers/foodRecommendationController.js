const FoodRecommendation = require("../models/foodRecommendation");

class FoodRecommendationController {
  // POST /api/food/recommendations
  static async getRecommendations(req, res) {
    try {
      const userId = req.userId;
      const availableItems = req.body.availableItems || [];

      if (!Array.isArray(availableItems) || availableItems.length === 0) {
        return res.status(400).json({ error: "No available food items provided" });
      }

      // Call the model (could later integrate AI or OpenAI API)
      const recommendations = await FoodRecommendation.generate(availableItems, userId);

      res.json({ success: true, recommendations });
    } catch (e) {
      console.error("getRecommendations error:", e);
      res.status(500).json({ error: "Failed to generate food recommendations" });
    }
  }
}

module.exports = FoodRecommendationController;
