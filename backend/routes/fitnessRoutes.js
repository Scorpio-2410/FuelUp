const express = require('express');
const FitnessController = require('../controllers/fitnessController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All fitness routes require authentication
router.use(authenticateToken);

// Fitness CRUD operations
router.post('/', FitnessController.createExercise);
router.get('/', FitnessController.getUserExercises);

// Date-based queries (MUST come before /:id to avoid conflicts)
router.get('/date/:date', FitnessController.getExercisesByDate);
router.get('/date-range', FitnessController.getExercisesByDateRange);

// Type-based queries
router.get('/type/:type', FitnessController.getExercisesByType);

// Analytics and summaries
router.get('/summary/:date', FitnessController.getDailyExerciseSummary);
router.get('/by-type/:date', FitnessController.getExercisesByTypeAndDate);
router.get('/weekly-stats', FitnessController.getWeeklyStats);

// FITNESS PREFERENCES ROUTES
router.get('/preferences', FitnessController.getFitnessPreferences);
router.post('/preferences', FitnessController.createOrUpdateFitnessPreferences);
router.put('/preferences', FitnessController.updateFitnessPreferences);
router.delete('/preferences', FitnessController.deleteFitnessPreferences);
router.get('/recommendations', FitnessController.getWorkoutRecommendations);
router.get('/options', FitnessController.getEquipmentOptions);

// Single fitness operations (MUST come LAST)
router.get('/:id', FitnessController.getExercise);
router.put('/:id', FitnessController.updateExercise);
router.delete('/:id', FitnessController.deleteExercise);

module.exports = router;
