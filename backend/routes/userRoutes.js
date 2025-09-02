const express = require('express');
const UserController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// Protected routes (authentication required)
router.get('/profile', authenticateToken, UserController.getProfile);
router.put('/profile', authenticateToken, UserController.updateProfile);
router.delete('/account', authenticateToken, UserController.deleteAccount);
router.get('/stats', authenticateToken, UserController.getStats);

module.exports = router;
