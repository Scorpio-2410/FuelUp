const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Neon PostgreSQL database connected");
    client.release();
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  }
};

const initializeDatabase = async () => {
  try {
    const client = await pool.connect();

    // helper: updated_at trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        password_hash TEXT NOT NULL,
        full_name VARCHAR(255),
        dob DATE,
        height_cm NUMERIC,
        weight_kg NUMERIC,
        gender VARCHAR(255),
        avatar_uri TEXT,
        notifications_enabled BOOLEAN DEFAULT TRUE,
        last_login_at TIMESTAMP,
        follow_up_frequency VARCHAR(255) DEFAULT 'daily',
        ethnicity VARCHAR(255) DEFAULT 'not_specified',
        fitness_goal VARCHAR(100) DEFAULT 'general_health',
        activity_level VARCHAR(50) DEFAULT 'moderate',
        daily_calorie_goal INTEGER DEFAULT 2000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

      DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
      CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // password reset tokens
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_prt_user ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_prt_expires ON password_reset_tokens(expires_at);
    `);

    console.log("✅ Tables ensured: users, password_reset_tokens");
    client.release();
  } catch (err) {
    console.error("❌ Database initialization error:", err.message);
    throw err;
  }
};

module.exports = { pool, testConnection, initializeDatabase };
