const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const FoodRecommendationController = require("../controllers/foodRecommendationController");

const router = express.Router();

/**
 * POST /api/foodRecommendation/recommend
 * Body: { inventory: [{name, quantity?, unit?, tags?}], prefs: {...}, topK?: number }
 */
router.post("/recommend", authenticateToken, FoodRecommendationController.foodRecommendation);

module.exports = router;
