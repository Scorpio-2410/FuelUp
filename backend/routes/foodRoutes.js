// backend/routes/foodRoutes.js
const express = require("express");
const ctrl = require("../controllers/foodController");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();

router.get("/foods/search", ctrl.searchFoods);
router.get("/foods/:id", ctrl.getFood);
router.get("/recipes/search", ctrl.searchRecipes);
router.get("/recipes/:id", ctrl.getRecipe);
router.post("/recipes/save", ctrl.saveRecipe);
router.post("/meals/log", authenticateToken, ctrl.logMeal);
router.get("/meals", authenticateToken, ctrl.getUserMeals);

module.exports = router;
