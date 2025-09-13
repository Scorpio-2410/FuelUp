const express = require("express");
const NutritionController = require("../controllers/nutritionController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// nutrition_profiles (merged prefs + targets)

// Get my nutrition profile
router.get("/profile", authenticateToken, NutritionController.getProfile);

// Upsert my nutrition profile (daily_calorie_target, macros JSON, prefs, etc.)
router.put("/profile", authenticateToken, NutritionController.upsertProfile);

module.exports = router;
