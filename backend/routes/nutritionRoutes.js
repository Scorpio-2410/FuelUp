// routes/nutritionRoutes.js
const express = require("express");
const NutritionController = require("../controllers/nutritionController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// nutrition_profiles (merged prefs + targets)
router.get("/profile", authenticateToken, NutritionController.getProfile);
router.put("/profile", authenticateToken, NutritionController.upsertProfile);
// Optional:
// router.patch("/profile", authenticateToken, NutritionController.updateProfile);

module.exports = router;
