const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const FoodRecommendationController = require("../controllers/foodRecommendationController");

const router = express.Router();

// POST /api/food/recommendations
router.post("/recommendations", authenticateToken, FoodRecommendationController.getRecommendations);

module.exports = router;
