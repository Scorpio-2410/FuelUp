const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const ExerciseInstructionController = require("../controllers/exerciseInstructionController");

const router = express.Router();

// All instruction endpoints require auth
router.use(authenticateToken);

// GET /api/exercises/:id/instructions?lang=en
router.get(
  "/exercises/:id/instructions",
  ExerciseInstructionController.getByExercise
);

// POST /api/exercises/:id/instructions
router.post(
  "/exercises/:id/instructions",
  ExerciseInstructionController.create
);

// PUT /api/exercise-instructions/:instructionId
router.put(
  "/exercise-instructions/:instructionId",
  ExerciseInstructionController.update
);

// DELETE /api/exercise-instructions/:instructionId
router.delete(
  "/exercise-instructions/:instructionId",
  ExerciseInstructionController.remove
);

module.exports = router;
