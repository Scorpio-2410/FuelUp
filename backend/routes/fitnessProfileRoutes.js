// routes/fitnessProfileRoutes.js
const express = require("express");
const FitnessProfileController = require("../controllers/fitnessProfileController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

/**
 * Public
 * (none for fitness — all require auth)
 */

/**
 * Protected
 * Mounted at /api/fitness
 */

// Get the current user’s fitness profile
router.get("/profile", authenticateToken, FitnessProfileController.getMyProfile);

// Create or update (upsert) the current user’s fitness profile
router.put("/profile", authenticateToken, FitnessProfileController.upsertMyProfile);

// If you later want partial update (PATCH):
// router.patch("/profile", authenticateToken, FitnessProfileController.updateMyProfile);

// (Optional) delete profile if needed
// router.delete("/profile", authenticateToken, FitnessProfileController.deleteMyProfile);

module.exports = router;
