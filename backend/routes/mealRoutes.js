const express = require('express');
const MealController = require('../controllers/mealController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All meal routes require authentication
router.use(authenticateToken);

// Meal CRUD operations
router.post('/', MealController.createMeal);
router.get('/', MealController.getUserMeals);

// Date-based queries (MUST come before /:id to avoid conflicts)
router.get('/date/:date', MealController.getMealsByDate);
router.get('/date-range', MealController.getMealsByDateRange);

// Nutrition analysis
router.get('/nutrition/:date', MealController.getDailyNutrition);
router.get('/by-type/:date', MealController.getMealsByTypeAndDate);

// Single meal operations (MUST come LAST)
router.get('/:id', MealController.getMeal);
router.put('/:id', MealController.updateMeal);
router.delete('/:id', MealController.deleteMeal);

module.exports = router;
