const express = require('express');
const ExerciseController = require('../controllers/exerciseController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All exercise routes require authentication
router.use(authenticateToken);

// Exercise CRUD operations
router.post('/', ExerciseController.createExercise);
router.get('/', ExerciseController.getUserExercises);

// Date-based queries (MUST come before /:id to avoid conflicts)
router.get('/date/:date', ExerciseController.getExercisesByDate);
router.get('/date-range', ExerciseController.getExercisesByDateRange);

// Type-based queries
router.get('/type/:type', ExerciseController.getExercisesByType);

// Analytics and summaries
router.get('/summary/:date', ExerciseController.getDailyExerciseSummary);
router.get('/by-type/:date', ExerciseController.getExercisesByTypeAndDate);
router.get('/weekly-stats', ExerciseController.getWeeklyStats);

// Single exercise operations (MUST come LAST)
router.get('/:id', ExerciseController.getExercise);
router.put('/:id', ExerciseController.updateExercise);
router.delete('/:id', ExerciseController.deleteExercise);

module.exports = router;
