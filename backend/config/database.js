// backend/config/database.js
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("Neon PostgreSQL database connected");
    client.release();
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
};

const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    // ---------- helper: updated_at trigger ----------
    await client.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // ================= USERS =================
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id                    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        email                 VARCHAR(255) NOT NULL UNIQUE,
        username              VARCHAR(255) NOT NULL UNIQUE,
        password_hash         TEXT NOT NULL,

        full_name             VARCHAR(255),
        dob                   DATE,
        gender                VARCHAR(255),
        ethnicity             VARCHAR(255) DEFAULT 'not_specified',
        avatar_uri            TEXT,

        notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        follow_up_frequency   VARCHAR(50) DEFAULT 'daily'
          CHECK (follow_up_frequency IN ('daily','weekly','monthly')),

        last_login_at         TIMESTAMPTZ,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
      CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // =========== SCHEDULES ===========
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id     INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        timezone    VARCHAR(64),
        preferences JSONB,
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      DROP TRIGGER IF EXISTS trg_schedules_updated_at ON schedules;
      CREATE TRIGGER trg_schedules_updated_at
      BEFORE UPDATE ON schedules
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // =========== EVENTS (with recurrence) ===========
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        schedule_id         INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,

        category            VARCHAR(20) NOT NULL
          CHECK (category IN ('meal','workout','work','other')),
        title               VARCHAR(255) NOT NULL,
        start_at            TIMESTAMPTZ NOT NULL,
        end_at              TIMESTAMPTZ,
        location            VARCHAR(255),
        notes               TEXT,

        recurrence_rule     VARCHAR(20) DEFAULT 'none'
          CHECK (recurrence_rule IN ('none','daily','weekly','weekday')),
        recurrence_until    TIMESTAMPTZ,

        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_events_schedule_time ON events (schedule_id, start_at);

      DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
      CREATE TRIGGER trg_events_updated_at
      BEFORE UPDATE ON events
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // ---------- Self-healing: normalize constraints every boot ----------
    await client.query(`
      ALTER TABLE public.events
        DROP CONSTRAINT IF EXISTS events_category_check;
      ALTER TABLE public.events
        ADD CONSTRAINT events_category_check
        CHECK (category IN ('meal','workout','work','other'));
    `);

    await client.query(`
      ALTER TABLE public.events
        DROP CONSTRAINT IF EXISTS events_recurrence_rule_check;
      ALTER TABLE public.events
        ADD CONSTRAINT events_recurrence_rule_check
        CHECK (recurrence_rule IN ('none','daily','weekly','weekday'));
    `);

    // ------- other tables (nutrition / meals / fitness / reset tokens) -------
    await client.query(`
      CREATE TABLE IF NOT EXISTS nutrition_profiles (
        id                    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id               INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        daily_calorie_target  INTEGER,
        macros                JSONB,
        pref_cuisines         TEXT,
        diet_restrictions     TEXT,
        disliked_foods        TEXT,
        allergies             TEXT,
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      DROP TRIGGER IF EXISTS trg_nutrition_profiles_updated_at ON nutrition_profiles;
      CREATE TRIGGER trg_nutrition_profiles_updated_at
      BEFORE UPDATE ON nutrition_profiles
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE IF NOT EXISTS meal_plans (
        id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name            VARCHAR(120) NOT NULL,
        status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','archived','draft')),
        start_date      DATE,
        end_date        DATE,
        target_calories INTEGER,
        notes           TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_meal_plans_user ON meal_plans(user_id);
      DROP TRIGGER IF EXISTS trg_meal_plans_updated_at ON meal_plans;
      CREATE TRIGGER trg_meal_plans_updated_at
      BEFORE UPDATE ON meal_plans
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE IF NOT EXISTS meals (
        id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        meal_plan_id INTEGER REFERENCES meal_plans(id) ON DELETE SET NULL,
        logged_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        name         VARCHAR(255),
        meal_type    VARCHAR(20) CHECK (meal_type IN ('breakfast','lunch','dinner','snack','other')),
        calories     INTEGER,
        protein_g    INTEGER,
        carbs_g      INTEGER,
        fat_g        INTEGER,
        notes        TEXT,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_meals_user_time ON meals (user_id, logged_at);
      CREATE INDEX IF NOT EXISTS idx_meals_plan      ON meals (meal_plan_id);
      DROP TRIGGER IF EXISTS trg_meals_updated_at ON meals;
      CREATE TRIGGER trg_meals_updated_at
      BEFORE UPDATE ON meals
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE IF NOT EXISTS fitness_profiles (
        id                       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id                  INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        height_cm                NUMERIC,
        weight_kg                NUMERIC,
        goal                     VARCHAR(100) DEFAULT 'general_health',
        activity_level           VARCHAR(50)  DEFAULT 'moderate',
        experience_level         VARCHAR(50),
        days_per_week            INTEGER,
        session_length_min       INTEGER,
        training_location        VARCHAR(100),
        equipment_available      TEXT,
        preferred_activities     TEXT,
        injuries_or_limitations  TEXT,
        coaching_style           VARCHAR(50),
        updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      DROP TRIGGER IF EXISTS trg_fitness_profiles_updated_at ON fitness_profiles;
      CREATE TRIGGER trg_fitness_profiles_updated_at
      BEFORE UPDATE ON fitness_profiles
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE IF NOT EXISTS fitness_plans (
        id                 INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        fitness_profile_id INTEGER NOT NULL REFERENCES fitness_profiles(id) ON DELETE CASCADE,
        name               VARCHAR(120) NOT NULL,
        status             VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','archived','draft')),
        start_date         DATE,
        end_date           DATE,
        notes              TEXT,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_fitness_plans_user    ON fitness_plans(user_id);
      CREATE INDEX IF NOT EXISTS idx_fitness_plans_profile ON fitness_plans(fitness_profile_id);
      DROP TRIGGER IF EXISTS trg_fitness_plans_updated_at ON fitness_plans;
      CREATE TRIGGER trg_fitness_plans_updated_at
      BEFORE UPDATE ON fitness_plans
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE IF NOT EXISTS exercises (
        id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        fitness_plan_id  INTEGER NOT NULL REFERENCES fitness_plans(id) ON DELETE CASCADE,
        name             VARCHAR(120) NOT NULL,
        muscle_group     VARCHAR(80),
        equipment        VARCHAR(120),
        difficulty       VARCHAR(40),
        duration_min     INTEGER,
        sets             INTEGER,
        reps             INTEGER,
        rest_seconds     INTEGER,
        notes            TEXT,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_exercises_plan ON exercises(fitness_plan_id);
      DROP TRIGGER IF EXISTS trg_exercises_updated_at ON exercises;
      CREATE TRIGGER trg_exercises_updated_at
      BEFORE UPDATE ON exercises
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code        VARCHAR(6) NOT NULL,
        expires_at  TIMESTAMPTZ NOT NULL,
        used        BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_prt_user   ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_prt_expire ON password_reset_tokens(expires_at);
    `);

    console.log("Schema initialization complete.");
  } catch (err) {
    console.error("Database initialization error:", err.message);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, testConnection, initializeDatabase };
