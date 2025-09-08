const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection, initializeDatabase } = require("./config/database");
const userRoutes = require("./routes/userRoutes");
const mealRoutes = require("./routes/mealRoutes");
const exerciseRoutes = require("./routes/exerciseRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Increased limit for avatar uploads
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/schedule", require("./routes/scheduleRoutes"));

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "FuelUp Backend API",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      meals: "/api/meals",
      exercises: "/api/exercises",
    },
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
  });
});

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

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Initialize database tables
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📊 API Documentation available at http://localhost:${PORT}`);
      console.log(`💾 Database: Connected to Neon PostgreSQL`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully");
  process.exit(0);
});

startServer();
