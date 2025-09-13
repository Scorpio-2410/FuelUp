const express = require('express');
const ExerciseController = require('../controllers/exerciseController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.use(authenticateToken);

router.post('/', ExerciseController.createExercise);
router.get('/', ExerciseController.listExercises);
router.get('/:id', ExerciseController.getExercise);
router.put('/:id', ExerciseController.updateExercise);
router.delete('/:id', ExerciseController.deleteExercise);

// Daily recommendation
router.get('/recommendations/daily', ExerciseController.getDailyPlan);

module.exports = router;
