// routes/userRoutes.js
const express = require("express");
const UserController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Public
router.get("/check-username", UserController.checkUsername);
router.get("/check-email", UserController.checkEmail);
router.post("/register", UserController.register);
router.post("/login", UserController.login);

// Password reset (public)
router.post("/reset/request", UserController.resetRequest);
router.post("/reset/confirm", UserController.resetConfirm);

// Protected
router.get("/profile", authenticateToken, UserController.getProfile);
router.put("/profile", authenticateToken, UserController.updateProfile);
router.delete("/account", authenticateToken, UserController.deleteAccount);

module.exports = router;
