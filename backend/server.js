const express = require("express");
const cors = require("cors");
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const { testConnection, initializeDatabase } = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const mealRoutes = require('./routes/mealRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');

// Initialize Neon SQL client
const sql = neon(process.env.DATABASE_URL);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/exercises', exerciseRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "FuelUp Backend API",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      meals: "/api/meals",
      exercises: "/api/exercises"
    }
  });
});

// Health check endpoint with database query
app.get("/health", async (req, res) => {
  try {
    const result = await sql`SELECT version()`;
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: "Connected",
        version: result[0].version
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: "Disconnected",
        error: error.message
      }
    });
  }
});

// Create table and insert data
app.get("/setup-test", async (req, res) => {
  try {
    // Drop existing table and recreate
    await sql`DROP TABLE IF EXISTS users_test`;
    // Create table
    await sql`
      CREATE TABLE IF NOT EXISTS users_test (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Insert first entry
    await sql`
      INSERT INTO users_test (name, email)
      VALUES ('Alice', 'alice@example.com')
    `;

    // Insert second entry  
    await sql`
      INSERT INTO users_test (name, email)
      VALUES ('Bob', 'bob@example.com')
    `;

    // Select all data
    const result = await sql`SELECT * FROM users_test`;

    res.json({
      status: "SUCCESS",
      message: "Table created and data inserted",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error: error.message
    });
  }
});

app.get("/see-all-dbtables", async (req, res) => {
  try {
    const dbnames = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;
    res.json({
      status: "SUCCESS",
      tables: dbnames.map(row => row.tablename) // cleaner response
    });
  } catch (err) {
    res.status(500).json({
      status: "ERROR",
      message: err.message
    });
  }
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
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
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

startServer();
