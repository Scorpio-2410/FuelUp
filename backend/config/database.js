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
    console.log("Connected to Neon PostgreSQL database");
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

    // Users table (profile)
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
      );
    `);

    // Meals table
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
      );
    `);

    // Exercises table
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
      );
    `);

    // Schedule Events table (for one-off + recurring)
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedule_events (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        subtitle TEXT,
        category VARCHAR(20) NOT NULL CHECK (category IN ('work','personal','outing','gym','mealprep')),
        color VARCHAR(20),

        event_date DATE, -- optional if recurring
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,

        recurrence JSONB, -- {"freq":"none|daily|weekly","daysOfWeek":[0..6],"startDate":"YYYY-MM-DD"}

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Schedule Preferences table (per-user)
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedule_prefs (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        gym_frequency_per_week INTEGER DEFAULT 3 CHECK (gym_frequency_per_week >= 0 AND gym_frequency_per_week <= 14),
        preferred_windows TEXT[],  -- e.g. {'06:30-08:30','17:00-19:30'}
        goals TEXT[],              -- e.g. {'strength','hypertrophy','endurance','fatloss'}
        min_gym_min INTEGER DEFAULT 35,
        max_gym_min INTEGER DEFAULT 70,
        include_meal_prep BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, meal_date);
      CREATE INDEX IF NOT EXISTS idx_exercises_user_date ON exercises(user_id, exercise_date);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      CREATE INDEX IF NOT EXISTS idx_schedule_events_user_date ON schedule_events(user_id, event_date);
      CREATE INDEX IF NOT EXISTS idx_schedule_events_user_cat ON schedule_events(user_id, category);
      CREATE INDEX IF NOT EXISTS idx_schedule_events_recurrence_gin ON schedule_events USING GIN (recurrence);
    `);

    // Trigger function to auto-update updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Apply triggers to tables
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_users_updated_at') THEN
          CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_meals_updated_at') THEN
          CREATE TRIGGER tr_meals_updated_at BEFORE UPDATE ON meals
          FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_exercises_updated_at') THEN
          CREATE TRIGGER tr_exercises_updated_at BEFORE UPDATE ON exercises
          FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_schedule_events_updated_at') THEN
          CREATE TRIGGER tr_schedule_events_updated_at BEFORE UPDATE ON schedule_events
          FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_schedule_prefs_updated_at') THEN
          CREATE TRIGGER tr_schedule_prefs_updated_at BEFORE UPDATE ON schedule_prefs
          FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
        END IF;
      END$$;
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
