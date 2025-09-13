const express = require("express");
const ExerciseController = require("../controllers/exerciseController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Create an exercise (optionally provide fitnessPlanId)
router.post("/", authenticateToken, ExerciseController.create);

// List my exercises (optional filter: ?planId= & limit=&offset=)
router.get("/", authenticateToken, ExerciseController.list);

// Single exercise CRUD
router.get("/:id", authenticateToken, ExerciseController.get);
router.put("/:id", authenticateToken, ExerciseController.update);
router.delete("/:id", authenticateToken, ExerciseController.remove);

module.exports = router;
