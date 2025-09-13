// routes/fitnessRoutes.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const FitnessController = require("../controllers/fitnessController");

const router = express.Router();

router.get("/", authenticateToken, FitnessController.get);
router.put("/", authenticateToken, FitnessController.upsert);

module.exports = router;
