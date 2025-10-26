const express = require("express");
const router = express.Router();
const {
  getQuestionsForUser,
  getAllQuestions,
  getQuestionsByType,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  saveUserResponses,
  getUserResponseHistory,
  getUserInsights
} = require("../controllers/targetQuestionController");
const { authenticateToken } = require("../middleware/auth");

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Question routes
router.get("/", getAllQuestions);
router.get("/type/:type", getQuestionsByType);
router.post("/", createQuestion);
router.put("/:id", updateQuestion);
router.delete("/:id", deleteQuestion);

// User-specific question routes
router.get("/user/:userId", getQuestionsForUser);
router.post("/user/:userId/responses", saveUserResponses);
router.get("/user/:userId/history", getUserResponseHistory);
router.get("/user/:userId/insights", getUserInsights);

module.exports = router;
