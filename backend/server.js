// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection, initializeDatabase } = require("./config/database");
const { verifySmtp } = require("./utils/mailer");

// Route groups (files you already have)
const userRoutes = require("./routes/userRoutes");
const fitnessProfileRoutes = require("./routes/fitnessProfileRoutes");
const fitnessPlanRoutes = require("./routes/fitnessPlanRoutes");
const exerciseRoutes = require("./routes/exerciseRoutes");
const exerciseCategoryRoutes = require("./routes/exerciseCategoryRoutes");
const nutritionRoutes = require("./routes/nutritionRoutes");
const mealPlanRoutes = require("./routes/mealPlanRoutes");
const mealRoutes = require("./routes/mealRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const targetQuestionRoutes = require("./routes/targetQuestionRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors()); // configure origins if needed
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ---------------- API routes ----------------

// Users
app.use("/api/users", userRoutes);

// Fitness namespace (matches frontend: /api/fitness/**)
app.use("/api/fitness", fitnessProfileRoutes); // expects internal routes like /profile
app.use("/api/fitness/plans", fitnessPlanRoutes); // expects internal routes like /, /:id, /current, /recommend
app.use("/api/fitness/exercises", exerciseRoutes); // expects internal routes like /, /:id
app.use("/api/fitness/categories", exerciseCategoryRoutes); // expects internal routes like /, /:id

// Nutrition (matches frontend: /api/nutrition/profile)
app.use("/api/nutrition", nutritionRoutes); // expects internal routes like /profile

// Meals namespace (matches frontend: /api/meals, /api/meals/plans, /api/meals/daily)
app.use("/api/meals", mealRoutes); // expects internal routes like / (CRUD), /daily
app.use("/api/meals", mealPlanRoutes); // expects internal routes like /plans, /plans/current, /plans/recommend

// Schedule namespace (matches frontend: /api/schedule and /api/schedule/events)
app.use("/api/schedule", scheduleRoutes); // expects internal routes like / (GET/POST/PUT), /events, /events/:id

// Target Questions namespace (for dynamic question system)
app.use("/api/questions", targetQuestionRoutes); // expects internal routes like /, /user/:userId, /type/:type

// ---------------- Root + health ----------------
app.get("/", (req, res) => {
  res.json({
    message: "FuelUp Backend API",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      fitness: {
        profile: "/api/fitness/profile",
        plans: "/api/fitness/plans",
        plansCurrent: "/api/fitness/plans/current",
        plansRecommend: "/api/fitness/plans/recommend",
        exercises: "/api/fitness/exercises",
        categories: "/api/fitness/categories",
      },
      nutrition: {
        profile: "/api/nutrition/profile",
      },
      meals: {
        base: "/api/meals",
        daily: "/api/meals/daily",
        plans: "/api/meals/plans",
        plansCurrent: "/api/meals/plans/current",
        plansRecommend: "/api/meals/plans/recommend",
      },
      schedule: {
        base: "/api/schedule",
        events: "/api/schedule/events",
      },
      questions: {
        base: "/api/questions",
        userQuestions: "/api/questions/user/:userId",
        userResponses: "/api/questions/user/:userId/responses",
        userHistory: "/api/questions/user/:userId/history",
        userInsights: "/api/questions/user/:userId/insights",
        byType: "/api/questions/type/:type",
      },
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404
app.use("*", (req, res) =>
  res.status(404).json({ error: "Endpoint not found", path: req.originalUrl })
);

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// Bootstrap
const startServer = async () => {
  try {
    await testConnection();
    await initializeDatabase(); // creates/ensures unified schema + triggers
    await verifySmtp(); // logs SMTP status; non-fatal
    app.listen(PORT, () =>
      console.log(`Server running at http://localhost:${PORT}`)
    );
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));

startServer();
