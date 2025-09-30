// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection, initializeDatabase } = require("./config/database");
const { verifySmtp } = require("./utils/mailer");

/* ---------------- Route groups ---------------- */
const userRoutes = require("./routes/userRoutes");
const fitnessProfileRoutes = require("./routes/fitnessProfileRoutes");
const fitnessPlanRoutes = require("./routes/fitnessPlanRoutes");
const planExerciseRoutes = require("./routes/planExerciseRoutes"); // exercises saved to a plan
const exerciseSearchRoutes = require("./routes/exerciseSearchRoutes"); // ExerciseDB proxy
const nutritionRoutes = require("./routes/nutritionRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const targetQuestionRoutes = require("./routes/targetQuestionRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

/* ---------------- Middleware ---------------- */
app.use(cors()); // configure origins if needed
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ---------------- API routes ---------------- */

// Users
app.use("/api/users", userRoutes);

// Fitness namespace
app.use("/api/fitness", fitnessProfileRoutes); // /api/fitness/profile (GET/PUT)
app.use("/api/fitness/plans", fitnessPlanRoutes); // CRUD plans
// ✅ Mount plan-exercise routes at the parameterized path so req.params.id is available
app.use("/api/fitness/plans/:id/exercises", planExerciseRoutes); // list/add/remove exercises for a plan

// ExerciseDB proxy (public catalog; no caching)
app.use("/api/exercises", exerciseSearchRoutes); // GET / (search via q/target), GET /:id, GET /:id/image

// Nutrition
app.use("/api/nutrition", nutritionRoutes); // /api/nutrition/profile

// Schedule
app.use("/api/schedule", scheduleRoutes); // /, /events, /events/:id

// Target Questions
app.use("/api/questions", targetQuestionRoutes);

/* ---------------- Root + health ---------------- */
app.get("/", (req, res) => {
  res.json({
    message: "FuelUp Backend API",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      fitness: {
        profile: "/api/fitness/profile",
        plans: "/api/fitness/plans",
        planExercises: "/api/fitness/plans/:id/exercises",
      },
      exercises: {
        search: "/api/exercises?q=&target=&limit=&offset=",
        detail: "/api/exercises/:id",
        image: "/api/exercises/:id/image?resolution=180",
      },
      nutrition: {
        profile: "/api/nutrition/profile",
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

/* ---------------- 404 + error handling ---------------- */
app.use("*", (req, res) =>
  res.status(404).json({ error: "Endpoint not found", path: req.originalUrl })
);

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

/* ---------------- Bootstrap ---------------- */
const startServer = async () => {
  try {
    await testConnection();
    await initializeDatabase();
    await verifySmtp(); // non-fatal if it fails
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
