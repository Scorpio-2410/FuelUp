const { Pool } = require("pg");
require("dotenv").config();

// Neon PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("Neon PostgreSQL database");
    client.release();
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    const client = await pool.connect();

    // Create Users table - aligned with frontend Profile type
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        dob DATE,
        height_cm DECIMAL(5,2),
        weight_kg DECIMAL(5,2),
        notifications BOOLEAN DEFAULT true,
        avatar_uri TEXT,
        ethnicity VARCHAR(50) DEFAULT 'not_specified',
        follow_up_frequency VARCHAR(20) DEFAULT 'daily',
        fitness_goal VARCHAR(50) DEFAULT 'general_health',
        activity_level VARCHAR(50) DEFAULT 'moderate',
        daily_calorie_goal INTEGER DEFAULT 2000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Meals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS meals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        meal_name VARCHAR(255) NOT NULL,
        meal_type VARCHAR(50) NOT NULL, -- breakfast, lunch, dinner, snack
        calories DECIMAL(8,2) NOT NULL,
        protein DECIMAL(6,2) DEFAULT 0,
        carbohydrates DECIMAL(6,2) DEFAULT 0,
        fat DECIMAL(6,2) DEFAULT 0,
        fiber DECIMAL(6,2) DEFAULT 0,
        sugar DECIMAL(6,2) DEFAULT 0,
        sodium DECIMAL(6,2) DEFAULT 0,
        meal_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Exercises table
    await client.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        exercise_name VARCHAR(255) NOT NULL,
        exercise_type VARCHAR(100) NOT NULL, -- cardio, strength, flexibility, sports
        duration_minutes INTEGER,
        calories_burned DECIMAL(6,2),
        sets INTEGER,
        reps INTEGER,
        weight_used DECIMAL(6,2),
        distance DECIMAL(6,2), -- for cardio exercises
        distance_unit VARCHAR(20) DEFAULT 'km', -- km, miles
        intensity VARCHAR(50), -- low, moderate, high
        exercise_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, meal_date);
      CREATE INDEX IF NOT EXISTS idx_exercises_user_date ON exercises(user_id, exercise_date);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    console.log("Database tables initialized successfully");
    client.release();
  } catch (err) {
    console.error("Database initialization error:", err.message);
    throw err;
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
};
