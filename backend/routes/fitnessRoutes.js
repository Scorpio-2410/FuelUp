const express = require('express');
const FitnessController = require('../controllers/fitnessController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All fitness routes require authentication
router.use(authenticateToken);

// FITNESS PREFERENCES ROUTES ONLY
router.get('/preferences', FitnessController.getFitnessPreferences);
router.post('/preferences', FitnessController.createOrUpdateFitnessPreferences);
router.put('/preferences', FitnessController.updateFitnessPreferences);
router.delete('/preferences', FitnessController.deleteFitnessPreferences);
router.get('/recommendations', FitnessController.getWorkoutRecommendations);
router.get('/options', FitnessController.getEquipmentOptions);

module.exports = router;
