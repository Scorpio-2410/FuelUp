// backend/routes/exerciseRoutes.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const ExerciseController = require("../controllers/exerciseController");

const router = express.Router();

// all exercise routes require auth
router.use(authenticateToken);

// GET /api/fitness/exercises?limit=&offset=
router.get("/", ExerciseController.listExercises);

// GET /api/fitness/exercises/:id
router.get("/:id", ExerciseController.getExerciseById);

// POST /api/fitness/exercises
router.post("/", ExerciseController.createExercise);

// PUT /api/fitness/exercises/:id
router.put("/:id", ExerciseController.updateExercise);

// DELETE /api/fitness/exercises/:id
router.delete("/:id", ExerciseController.deleteExercise);

module.exports = router;
