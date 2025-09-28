const TargetQuestion = require("../models/targetQuestion");
const UserQuestionResponse = require("../models/userQuestionResponse");
const User = require("../models/User");

// Get questions for a specific user based on their frequency settings
const getQuestionsForUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Get user to check their follow_up_frequency
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const result = await TargetQuestion.getQuestionsForUser(userId, user.followUpFrequency);
    
    res.json({
      success: true,
      data: result.questions,
      userFrequency: user.followUpFrequency,
      totalQuestions: result.questions.length,
      alreadyAnswered: result.alreadyAnswered || false,
      timeframe: result.timeframe || null
    });
  } catch (error) {
    console.error("Error getting questions for user:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get questions for user",
      error: error.message 
    });
  }
};

// Get all questions with filtering
const getAllQuestions = async (req, res) => {
  try {
    const { type, priority, frequency, limit = 50, offset = 0 } = req.query;
    
    const questions = await TargetQuestion.findAll({
      type,
      priority,
      frequency,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: questions,
      count: questions.length
    });
  } catch (error) {
    console.error("Error getting all questions:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get questions",
      error: error.message 
    });
  }
};

// Get questions by type
const getQuestionsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { priority, frequency, limit = 50, offset = 0 } = req.query;
    
    const questions = await TargetQuestion.findByType(type, {
      priority,
      frequency,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: questions,
      count: questions.length
    });
  } catch (error) {
    console.error("Error getting questions by type:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get questions by type",
      error: error.message 
    });
  }
};

// Create a new question
const createQuestion = async (req, res) => {
  try {
    const questionData = req.body;
    
    // Validate required fields
    if (!questionData.type || !questionData.text) {
      return res.status(400).json({ 
        success: false, 
        message: "Type and text are required fields" 
      });
    }

    const question = await TargetQuestion.create(questionData);
    
    res.status(201).json({
      success: true,
      data: question,
      message: "Question created successfully"
    });
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create question",
      error: error.message 
    });
  }
};

// Update a question
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const questionData = req.body;
    
    const question = await TargetQuestion.findById(parseInt(id));
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        message: "Question not found" 
      });
    }

    const updatedQuestion = await question.update(questionData);
    
    res.json({
      success: true,
      data: updatedQuestion,
      message: "Question updated successfully"
    });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update question",
      error: error.message 
    });
  }
};

// Delete a question
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const question = await TargetQuestion.findById(parseInt(id));
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        message: "Question not found" 
      });
    }

    await question.delete();
    
    res.json({
      success: true,
      message: "Question deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete question",
      error: error.message 
    });
  }
};

// Save user responses to questions
const saveUserResponses = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { responses } = req.body;
    
    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({ 
        success: false, 
        message: "Responses array is required" 
      });
    }

    // Validate each response
    for (const response of responses) {
      if (!response.questionId || response.responseValue === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: "Each response must have questionId and responseValue" 
        });
      }
    }

    const savedResponses = await UserQuestionResponse.saveResponses(userId, responses);
    
    res.status(201).json({
      success: true,
      data: savedResponses,
      message: "Responses saved successfully"
    });
  } catch (error) {
    console.error("Error saving user responses:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to save responses",
      error: error.message 
    });
  }
};

// Get user response history
const getUserResponseHistory = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { questionId, limit = 50, offset = 0, daysBack = 30 } = req.query;
    
    let responses;
    if (questionId) {
      responses = await UserQuestionResponse.getResponseHistory(
        userId, 
        parseInt(questionId), 
        parseInt(daysBack)
      );
    } else {
      const since = new Date();
      since.setDate(since.getDate() - parseInt(daysBack));
      
      responses = await UserQuestionResponse.findByUser(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        since
      });
    }
    
    res.json({
      success: true,
      data: responses,
      count: responses.length
    });
  } catch (error) {
    console.error("Error getting user response history:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get response history",
      error: error.message 
    });
  }
};

// Get user insights based on their responses
const getUserInsights = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { daysBack = 30 } = req.query;
    
    const insights = await UserQuestionResponse.getUserInsights(userId, parseInt(daysBack));
    
    res.json({
      success: true,
      data: insights,
      message: "User insights retrieved successfully"
    });
  } catch (error) {
    console.error("Error getting user insights:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get user insights",
      error: error.message 
    });
  }
};

module.exports = {
  getQuestionsForUser,
  getAllQuestions,
  getQuestionsByType,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  saveUserResponses,
  getUserResponseHistory,
  getUserInsights
};
