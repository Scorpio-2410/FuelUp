// routes/fitnessProfileRoutes.js
const express = require("express");
const FitnessProfileController = require("../controllers/fitnessProfileController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

/**
 * Final URLs (when mounted at /api/fitness):
 *   GET  /api/fitness/profile
 *   PUT  /api/fitness/profile
 * (optional)
 *   PATCH /api/fitness/profile
 */
router.get(
  "/profile",
  authenticateToken,
  FitnessProfileController.getMyProfile
);
router.put(
  "/profile",
  authenticateToken,
  FitnessProfileController.upsertMyProfile
);
// If you want partial update support later, uncomment this:
// router.patch("/profile", authenticateToken, FitnessProfileController.updateMyProfile);

module.exports = router;
