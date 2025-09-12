const express = require("express");
const UserController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Public
router.post("/register", UserController.register);
router.post("/login", UserController.login);

// Password reset (public)
router.post("/reset/request", UserController.resetRequest);
router.post("/reset/confirm", UserController.resetConfirm);

// Protected
router.get("/profile", authenticateToken, UserController.getProfile);
router.put("/profile", authenticateToken, UserController.updateProfile);
router.delete("/account", authenticateToken, UserController.deleteAccount);

router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const user = await require("../models/User").findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      stats: {
        // simple derived metrics (optional)
        bmi:
          user.heightCm && user.weightKg
            ? +(user.weightKg / Math.pow(user.heightCm / 100, 2)).toFixed(1)
            : null,
        recommendedCalories: user.dailyCalorieGoal ?? 2000,
        fitnessGoal: user.fitnessGoal,
        activityLevel: user.activityLevel,
      },
    });
  } catch (e) {
    console.error("Stats error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
