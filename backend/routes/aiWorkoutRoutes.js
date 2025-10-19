const express = require("express");
const router = express.Router();
const {
  suggestWorkoutWithExercises,
} = require("../controllers/aiWorkoutController");
router.post("/ai/suggest-workout", suggestWorkoutWithExercises);
module.exports = router;
