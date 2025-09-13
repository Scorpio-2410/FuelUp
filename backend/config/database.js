const { Pool } = require('pg');
require('dotenv').config();

// Neon PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Neon PostgreSQL database');
    client.release();
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    
    // Drop existing tables to clean up
    await client.query(`
      DROP TABLE IF EXISTS meals CASCADE;
      DROP TABLE IF EXISTS exercises CASCADE;
      DROP TABLE IF EXISTS schedule_events CASCADE;
      DROP TABLE IF EXISTS schedule_prefs CASCADE;
      DROP TABLE IF EXISTS fitness CASCADE;
      DROP TABLE IF EXISTS playing_with_neon CASCADE;
    `);
    
    // Create Users table - exactly matching diagram
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        password TEXT NOT NULL,
        full_name VARCHAR(255),
        dob DATE,
        height_cm NUMERIC,
        weight_kg NUMERIC,
        gender VARCHAR(255),
        avatar_uri TEXT,
        notifications_enabled BOOLEAN,
        last_login_at TIMESTAMP,
        follow_up_frequency VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Fitness table - exactly matching diagram
    await client.query(`
      CREATE TABLE IF NOT EXISTS fitness (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        goal VARCHAR(100),
        activity_level VARCHAR(50),
        experience_level VARCHAR(50),
        days_per_week INTEGER,
        session_length_min INTEGER,
        training_location VARCHAR(100),
        equipment_available TEXT,
        preferred_activities TEXT,
        injuries_or_limitations TEXT,
        coaching_style VARCHAR(50),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

      

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_fitness_user_id ON fitness(user_id);
    `);



    // CREATE exercises + goal_exercises + user_workouts tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        description TEXT,
        video_url TEXT,
        muscle_group VARCHAR(40) NOT NULL,
        equipment_required TEXT,
        difficulty VARCHAR(20) NOT NULL,
        is_bodyweight BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS goal_exercises (
        id SERIAL PRIMARY KEY,
        goal VARCHAR(100) NOT NULL,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        priority SMALLINT DEFAULT 10
      );
      CREATE TABLE IF NOT EXISTS user_workouts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        workout_date DATE NOT NULL,
        intensity VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, workout_date)
      );
      CREATE TABLE IF NOT EXISTS user_workout_exercises (
        id SERIAL PRIMARY KEY,
        user_workout_id INTEGER NOT NULL REFERENCES user_workouts(id) ON DELETE CASCADE,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id),
        sets SMALLINT NOT NULL,
        reps SMALLINT NOT NULL,
        rir SMALLINT,
        tempo VARCHAR(20)
      );
    `);

    // Seed data
    await client.query(`
      INSERT INTO exercises (name, description, video_url, muscle_group, equipment_required, difficulty, is_bodyweight)
      VALUES
        ('Push-Up', 'Hands under shoulders, body straight...', 'https://youtu.be/_l3ySVKYVJ8', 'push', 'none', 'beginner', true),
        ('Incline Dumbbell Press', 'Set bench 30–45°, press...', 'https://youtu.be/8iPEnn-ltC8', 'push', 'dumbbells,bench', 'intermediate', false),
        ('Lat Pulldown', 'Grip just outside shoulders...', 'https://youtu.be/CAwf7n6Luuc', 'pull', 'pulldown_machine', 'beginner', false),
        ('Barbell Row', 'Flat back, row to lower ribs...', 'https://youtu.be/vT2GjY_Umpw', 'pull', 'barbell', 'intermediate', false),
        ('Goblet Squat', 'Elbows under DB, sit between hips...', 'https://youtu.be/6xwYd5ZrG9k', 'legs', 'dumbbell', 'beginner', false),
        ('Back Squat', 'Bar high/low per comfort...', 'https://youtu.be/ultWZbUMPL8', 'legs', 'barbell,rack', 'advanced', false),
        ('Plank', 'Glutes + ribs down...', 'https://youtu.be/pSHjTRCQxIw', 'core', 'none', 'beginner', true)
      ON CONFLICT DO NOTHING;
    `);

    await client.query(`
      INSERT INTO goal_exercises (goal, exercise_id, priority)
      SELECT 'muscle_gain', id, 5 FROM exercises;
      INSERT INTO goal_exercises (goal, exercise_id, priority)
      SELECT 'fat_loss', id, 10 FROM exercises;
      INSERT INTO goal_exercises (goal, exercise_id, priority)
      SELECT 'general_health', id, 8 FROM exercises;
    `);

    console.log('✅ Database tables initialized successfully');
    console.log('📊 Tables created: users, fitness (matching diagram)');
    client.release();
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    throw err;
  }
};


module.exports = {
  pool,
  testConnection,
  initializeDatabase
};
