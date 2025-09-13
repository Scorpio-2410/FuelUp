// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection, initializeDatabase } = require("./config/database");
const { verifySmtp } = require("./utils/mailer");

// Route groups
const userRoutes = require("./routes/userRoutes");
const fitnessProfileRoutes = require("./routes/fitnessProfileRoutes");
const fitnessPlanRoutes = require("./routes/fitnessPlanRoutes");
const exerciseRoutes = require("./routes/exerciseRoutes");
const nutritionRoutes = require("./routes/nutritionRoutes");
const mealPlanRoutes = require("./routes/mealPlanRoutes");
const mealRoutes = require("./routes/mealRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors()); // configure origins if needed
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api/users", userRoutes);
app.use("/api/fitness-profiles", fitnessProfileRoutes);
app.use("/api/fitness-plans", fitnessPlanRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/nutrition", nutritionRoutes); // nutrition_profiles
app.use("/api/meal-plans", mealPlanRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/schedules", scheduleRoutes);

// Root + health
app.get("/", (req, res) => {
  res.json({
    message: "FuelUp Backend API",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      fitnessProfiles: "/api/fitness-profiles",
      fitnessPlans: "/api/fitness-plans",
      exercises: "/api/exercises",
      nutrition: "/api/nutrition",
      mealPlans: "/api/meal-plans",
      meals: "/api/meals",
      schedules: "/api/schedules",
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
    await verifySmtp(); // log SMTP status; non-fatal
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
