// routes/nutritionRoutes.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const NutritionController = require("../controllers/nutritionController");

const router = express.Router();

router.get("/targets", authenticateToken, NutritionController.getTargets);
router.put("/targets", authenticateToken, NutritionController.setTargets);

module.exports = router;
