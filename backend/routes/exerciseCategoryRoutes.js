// backend/routes/exerciseCategoryRoutes.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const ExerciseCategoryController = require("../controllers/exerciseCategoryController");

const router = express.Router();

// all exercise category routes require auth
router.use(authenticateToken);

// GET /api/fitness/categories?isGymExercise=true/false
router.get("/", ExerciseCategoryController.listCategories);

// GET /api/fitness/categories/:id
router.get("/:id", ExerciseCategoryController.getCategoryById);

// POST /api/fitness/categories
router.post("/", ExerciseCategoryController.createCategory);

// PUT /api/fitness/categories/:id
router.put("/:id", ExerciseCategoryController.updateCategory);

// DELETE /api/fitness/categories/:id
router.delete("/:id", ExerciseCategoryController.deleteCategory);

module.exports = router;
