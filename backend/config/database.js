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
    `);
    
    // Create Users table - exactly matching diagram
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        password_hash TEXT NOT NULL,
        full_name VARCHAR(255),
        dob DATE,
        height_cm NUMERIC,
        weight_kg NUMERIC,
        gender VARCHAR(255),
        avatar_uri TEXT,
        notifications_enabled BOOLEAN,
        last_login_at DATETIME,
        follow_up_frequency VARCHAR(255),
        created_at DATETIME,
        updated_at DATETIME
      )
    `);

    // Create Fitness table - exactly matching diagram
    await client.query(`
      CREATE TABLE IF NOT EXISTS fitness (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        goal VARCHAR(255),
        activity_level VARCHAR(255),
        experience_level VARCHAR(255),
        days_per_week INTEGER,
        session_length_min INTEGER,
        training_location VARCHAR(255),
        equipment_available TEXT,
        preferred_activities TEXT,
        injuries_or_limitations TEXT,
        coaching_style VARCHAR(255),
        updated_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_fitness_user_id ON fitness(user_id);
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
