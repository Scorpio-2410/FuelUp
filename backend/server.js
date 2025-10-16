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
const scheduleRoutes = require("./routes/scheduleRoutes");
const targetQuestionRoutes = require("./routes/targetQuestionRoutes");
const quotesRoutes = require("./routes/quotesRoutes");
const foodRecommendationRoutes = require("./routes/foodRecommendationRoutes");


/* ---- NEW: FatSecret catalogs + Meal Planner ---- */
const foodRoutes = require("./routes/foodRoutes"); // foods/recipes browse + save
const mealPlanRoutes = require("./routes/mealPlanRoutes"); // create plan, add meal, summary

/* ---- Step Tracking ---- */
const stepStreakRoutes = require("./routes/stepStreakRoutes"); // step tracking and analytics

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
app.use("/api/fitness/plans/:id/exercises", planExerciseRoutes); // list/add/remove exercises for a plan

// ExerciseDB proxy (public catalog; no caching)
app.use("/api/exercises", exerciseSearchRoutes); // GET / (search via q/target), GET /:id, GET /:id/image

// Schedule
app.use("/api/schedule", scheduleRoutes); // /, /events, /events/:id

// Target Questions
app.use("/api/questions", targetQuestionRoutes);

// Motivational Quotes
app.use("/api/quotes", quotesRoutes);

/* ---- NEW mounts ----
   foodRoutes defines:
     GET  /foods/search
     GET  /foods/:id
     GET  /recipes/search
     GET  /recipes/:id
     POST /recipes/save
   mealPlanRoutes defines:
     POST /plans
     POST /plans/add
     GET  /plans/:planId/summary
*/
app.use("/api", foodRoutes);
app.use("/api", mealPlanRoutes);

// Step Tracking
app.use("/api/steps", stepStreakRoutes);

//Ai Food Recommendations
app.use("/api/food", foodRecommendationRoutes);


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
      quotes: {
        all: "/api/quotes",
        random: "/api/quotes/random",
        daily: "/api/quotes/daily",
        byId: "/api/quotes/:id",
        authors: "/api/quotes/authors",
      },

      /* --- NEW docs for clients --- */
      catalog: {
        foodsSearch: "/api/foods/search?q=&page=",
        foodDetail: "/api/foods/:id",
        recipesSearch: "/api/recipes/search?q=&page=",
        recipeDetail: "/api/recipes/:id",
        recipeSave: "/api/recipes/save",
      },
      mealPlanner: {
        createPlan: "/api/plans",
        addMeal: "/api/plans/add",
        planSummary: "/api/plans/:planId/summary",
      },
      steps: {
        upsert: "POST /api/steps",
        getByDate: "/api/steps/:date",
        getRange: "/api/steps/range?start=&end=",
        getStats: "/api/steps/stats?start=&end=&period=",
        getWeekly: "/api/steps/weekly?start=&end=",
        getMonthly: "/api/steps/monthly?start=&end=",
        getStreak: "/api/steps/streak",
        getChart: "/api/steps/chart?start=&end=",
        delete: "DELETE /api/steps/:date",
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
