const express = require("express");
const FitnessProfileController = require("../controllers/fitnessProfileController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get my fitness profile (1:1 with user)
router.get("/", authenticateToken, FitnessProfileController.getMyProfile);

// Upsert my fitness profile
router.put("/", authenticateToken, FitnessProfileController.upsertMyProfile);

module.exports = router;
