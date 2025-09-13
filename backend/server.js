// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection, initializeDatabase } = require("./config/database");
const { verifySmtp } = require("./utils/mailer");

// Route groups
const userRoutes = require("./routes/userRoutes");
const fitnessRoutes = require("./routes/fitnessRoutes");
const nutritionRoutes = require("./routes/nutritionRoutes");
const mealRoutes = require("./routes/mealRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors()); // customize origins if needed
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api/users", userRoutes);
app.use("/api/fitness", fitnessRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/meals", mealRoutes);

// Root + health
app.get("/", (req, res) => {
  res.json({
    message: "FuelUp Backend API",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      fitness: "/api/fitness",
      nutrition: "/api/nutrition",
      meals: "/api/meals",
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
    await initializeDatabase(); // ensures users, password_reset_tokens, fitness, nutrition_targets, meals, triggers, indexes

    // Verify SMTP on boot (logs success/failure, does not crash server)
    await verifySmtp();

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
