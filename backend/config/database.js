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
    /* ---------- helper: updated_at trigger ---------- */
    await client.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    /* ================= USERS ================= */
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
      BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    /* =========== SCHEDULES & EVENTS (recurrence) =========== */
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
      BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION set_updated_at();

    // =========== EVENTS (with recurrence) ===========
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        schedule_id      INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
        category         VARCHAR(20) NOT NULL,
        title            VARCHAR(255) NOT NULL,
        start_at         TIMESTAMPTZ NOT NULL,
        end_at           TIMESTAMPTZ,
        location         VARCHAR(255),
        notes            TEXT,
        recurrence_rule  VARCHAR(20) DEFAULT 'none',
        recurrence_until TIMESTAMPTZ,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_events_schedule_time ON events (schedule_id, start_at);

      -- normalize checks (idempotent)
      ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_category_check;
      ALTER TABLE public.events ADD CONSTRAINT events_category_check
        CHECK (category IN ('meal','workout','work','other'));

      ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_recurrence_rule_check;
      ALTER TABLE public.events ADD CONSTRAINT events_recurrence_rule_check
        CHECK (recurrence_rule IN ('none','daily','weekly','weekday'));

      DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
      CREATE TRIGGER trg_events_updated_at
      BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    /* =========== NUTRITION & MEALS =========== */
    await client.query(`
      CREATE TABLE IF NOT EXISTS nutrition_profiles (
        id                    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id               INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        daily_calorie_target  INTEGER,
        macros                JSONB,
        pref_cuisines         TEXT,
        diet_restrictions     TEXT,
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      DROP TRIGGER IF EXISTS trg_nutrition_profiles_updated_at ON nutrition_profiles;
      CREATE TRIGGER trg_nutrition_profiles_updated_at
      BEFORE UPDATE ON nutrition_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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
      BEFORE UPDATE ON meal_plans FOR EACH ROW EXECUTE FUNCTION set_updated_at();

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
      BEFORE UPDATE ON meals FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    /* =========== RECIPES (FatSecret-backed) & PLAN LINKS =========== */
    await client.query(`
      CREATE TABLE IF NOT EXISTS recipes (
        id                 INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id            INTEGER REFERENCES users(id) ON DELETE SET NULL,
        source             VARCHAR(20) NOT NULL DEFAULT 'fatsecret' CHECK (source IN ('fatsecret','custom')),
        external_id        VARCHAR(64),
        name               VARCHAR(255) NOT NULL,
        description        TEXT,
        cook_time_min      INTEGER DEFAULT 0,
        yield_servings     NUMERIC,
        steps              JSONB DEFAULT '[]',
        image_url          TEXT,
        nutrition_per_serv JSONB NOT NULL DEFAULT '{}'::jsonb,
        ingredients        JSONB NOT NULL DEFAULT '[]',
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      DROP TRIGGER IF EXISTS trg_recipes_updated_at ON recipes;
      CREATE TRIGGER trg_recipes_updated_at
      BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE IF NOT EXISTS meal_plan_recipes (
        id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        meal_plan_id  INTEGER NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
        recipe_id     INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        meal_type     VARCHAR(20) DEFAULT 'other'
          CHECK (meal_type IN ('breakfast','lunch','dinner','snack','other')),
        servings      NUMERIC NOT NULL DEFAULT 1,
        scheduled_at  TIMESTAMPTZ,
        notes         TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_mpr_plan ON meal_plan_recipes(meal_plan_id);

      CREATE OR REPLACE FUNCTION enforce_five_plans()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (SELECT COUNT(*) FROM meal_plans WHERE user_id = NEW.user_id AND status <> 'archived') >= 5 THEN
          RAISE EXCEPTION 'Plan limit reached (max 5 active/draft per user)';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_enforce_five_plans ON meal_plans;
      CREATE TRIGGER trg_enforce_five_plans
      BEFORE INSERT ON meal_plans FOR EACH ROW EXECUTE FUNCTION enforce_five_plans();
    `);

    /* =========== FITNESS PROFILES & (simplified) PLANS =========== */
    await client.query(`
      CREATE TABLE IF NOT EXISTS fitness_profiles (
        id                 INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id            INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        height_cm          NUMERIC,
        weight_kg          NUMERIC,
        goal               VARCHAR(100) DEFAULT 'general_health',
        activity_level     VARCHAR(50)  DEFAULT 'moderate',
        days_per_week      INTEGER,
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      DROP TRIGGER IF EXISTS trg_fitness_profiles_updated_at ON fitness_profiles;
      CREATE TRIGGER trg_fitness_profiles_updated_at
      BEFORE UPDATE ON fitness_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE IF NOT EXISTS fitness_plans (
        id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name       VARCHAR(120) NOT NULL,
        status     VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','archived','draft')),
        notes      TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_fitness_plans_user ON fitness_plans(user_id);

      DO $$
      BEGIN
        BEGIN
          ALTER TABLE fitness_plans DROP COLUMN IF EXISTS fitness_profile_id;
        EXCEPTION WHEN undefined_column THEN NULL;
        END;
        BEGIN
          ALTER TABLE fitness_plans DROP COLUMN IF EXISTS start_date;
        EXCEPTION WHEN undefined_column THEN NULL;
        END;
        BEGIN
          ALTER TABLE fitness_plans DROP COLUMN IF EXISTS end_date;
        EXCEPTION WHEN undefined_column THEN NULL;
        END;
      END $$;

      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relkind = 'i' AND c.relname = 'idx_fitness_plans_profile'
        ) THEN
          EXECUTE 'DROP INDEX idx_fitness_plans_profile';
        END IF;
      END $$;

      DROP TRIGGER IF EXISTS trg_fitness_plans_updated_at ON fitness_plans;
      CREATE TRIGGER trg_fitness_plans_updated_at
      BEFORE UPDATE ON fitness_plans FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

        /* =========== EXERCISES =========== */
    await client.query(`
      CREATE TABLE IF NOT EXISTS exercise_categories (
        id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name            VARCHAR(120) NOT NULL UNIQUE,
        description     TEXT,
        is_gym_exercise BOOLEAN NOT NULL DEFAULT FALSE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      DROP TRIGGER IF EXISTS trg_exercise_categories_updated_at ON exercise_categories;
      CREATE TRIGGER trg_exercise_categories_updated_at
      BEFORE UPDATE ON exercise_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE IF NOT EXISTS exercises (
        id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        category_id  INTEGER REFERENCES exercise_categories(id) ON DELETE SET NULL,
        name         VARCHAR(120) NOT NULL,
        muscle_group VARCHAR(80),
        equipment    VARCHAR(120),
        difficulty   VARCHAR(40),
        -- consolidated metadata columns
        secondary_muscles TEXT,
        category VARCHAR(80),
        external_id VARCHAR(64),
        gif_url TEXT,
        video_url TEXT,
        image_url TEXT,
        notes        TEXT,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- create index for exercises.category_id (idempotent)
      CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises (category_id);

      DROP TRIGGER IF EXISTS trg_exercises_updated_at ON exercises;
      CREATE TRIGGER trg_exercises_updated_at
      BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      -- Migration helpers: add new columns if missing, drop legacy columns if present
      ALTER TABLE exercises ADD COLUMN IF NOT EXISTS secondary_muscles TEXT;
      ALTER TABLE exercises ADD COLUMN IF NOT EXISTS category VARCHAR(80);
  ALTER TABLE exercises ADD COLUMN IF NOT EXISTS target VARCHAR(80);
      ALTER TABLE exercises ADD COLUMN IF NOT EXISTS external_id VARCHAR(64);
      ALTER TABLE exercises ADD COLUMN IF NOT EXISTS gif_url TEXT;
      ALTER TABLE exercises ADD COLUMN IF NOT EXISTS video_url TEXT;
      ALTER TABLE exercises ADD COLUMN IF NOT EXISTS image_url TEXT;
      -- remove legacy columns safely if they exist
      ALTER TABLE exercises DROP COLUMN IF EXISTS duration_min;
      ALTER TABLE exercises DROP COLUMN IF EXISTS sets;
      ALTER TABLE exercises DROP COLUMN IF EXISTS reps;
      ALTER TABLE exercises DROP COLUMN IF EXISTS rest_seconds;
    `);

    /* =========== PLAN EXERCISES =========== */
    await client.query(`
      CREATE TABLE IF NOT EXISTS fitness_plan_exercises (
        id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        plan_id     INTEGER NOT NULL REFERENCES fitness_plans(id) ON DELETE CASCADE,
        source      VARCHAR(32) NOT NULL DEFAULT 'exercisedb',
        external_id VARCHAR(64) NOT NULL,
        name        VARCHAR(200) NOT NULL,
        gif_url     TEXT,
        body_part   VARCHAR(80),
        target      VARCHAR(80),
        equipment   VARCHAR(80),
        added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fitness_plan_exercises_plan_id_source_external_id_key
          UNIQUE (plan_id, source, external_id)
      );

      CREATE INDEX IF NOT EXISTS idx_plan_exercises_plan ON fitness_plan_exercises(plan_id);
    `);

    /* =========== MOTIVATIONAL QUOTES & AUTHORS =========== */
    await client.query(`
      CREATE TABLE IF NOT EXISTS quote_authors (
        id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name        VARCHAR(255) NOT NULL UNIQUE,
        birth_year  INTEGER,
        death_year  INTEGER,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      DROP TRIGGER IF EXISTS trg_quote_authors_updated_at ON quote_authors;
      CREATE TRIGGER trg_quote_authors_updated_at
      BEFORE UPDATE ON quote_authors FOR EACH ROW EXECUTE FUNCTION set_updated_at();

      CREATE TABLE IF NOT EXISTS motivational_quotes (
        id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        quote_text  TEXT NOT NULL,
        author_id   INTEGER REFERENCES quote_authors(id) ON DELETE SET NULL,
        category    VARCHAR(50) DEFAULT 'general',
        is_active   BOOLEAN NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_motivational_quotes_author ON motivational_quotes(author_id);
      CREATE INDEX IF NOT EXISTS idx_motivational_quotes_category ON motivational_quotes(category);
      CREATE INDEX IF NOT EXISTS idx_motivational_quotes_active ON motivational_quotes(is_active);

      DROP TRIGGER IF EXISTS trg_motivational_quotes_updated_at ON motivational_quotes;
      CREATE TRIGGER trg_motivational_quotes_updated_at
      BEFORE UPDATE ON motivational_quotes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    /* =========== QUESTIONS / RESPONSES / RESET TOKENS =========== */
    await client.query(`
      CREATE TABLE IF NOT EXISTS target_questions (
        id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        type             VARCHAR(20) NOT NULL CHECK (type IN ('daily','weekly','monthly')),
        text             TEXT NOT NULL,
        priority         VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
        frequency        VARCHAR(20) NOT NULL DEFAULT 'mandatory'
           CHECK (frequency IN ('mandatory','rotational','optional','occasional','rare')),
        options          JSONB NOT NULL DEFAULT '[]',
        is_slider        BOOLEAN NOT NULL DEFAULT FALSE,
        slider_config    JSONB,
        category         VARCHAR(50) DEFAULT 'general',
        influence_weight DECIMAL(3,2) DEFAULT 1.0 CHECK (influence_weight >= 0.1 AND influence_weight <= 5.0),
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_target_questions_type ON target_questions(type);

      CREATE TABLE IF NOT EXISTS user_question_responses (
        id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question_id    INTEGER NOT NULL REFERENCES target_questions(id) ON DELETE CASCADE,
        response_value INTEGER NOT NULL,
        response_text  VARCHAR(255),
        asked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_user_responses_user ON user_question_responses(user_id);

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code       VARCHAR(6) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used       BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_prt_user   ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_prt_expire ON password_reset_tokens(expires_at);
    `);

    /* =========== STEP STREAKS (step tracking) =========== */
    await client.query(`
      CREATE TABLE IF NOT EXISTS step_streaks (
        id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date        DATE NOT NULL,
        step_count  INTEGER NOT NULL DEFAULT 0 CHECK (step_count >= 0),
        calories    INTEGER,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT step_streaks_user_date_unique UNIQUE (user_id, date)
      );

      CREATE INDEX IF NOT EXISTS idx_step_streaks_user ON step_streaks(user_id);
      CREATE INDEX IF NOT EXISTS idx_step_streaks_date ON step_streaks(date);
      CREATE INDEX IF NOT EXISTS idx_step_streaks_user_date ON step_streaks(user_id, date DESC);

      DROP TRIGGER IF EXISTS trg_step_streaks_updated_at ON step_streaks;
      CREATE TRIGGER trg_step_streaks_updated_at
      BEFORE UPDATE ON step_streaks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    /* =========== FITNESS ACTIVITIES (exercise tracking) =========== */
    await client.query(`
      CREATE TABLE IF NOT EXISTS fitness_activities (
        id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date            DATE NOT NULL,
        activity_type   VARCHAR(50) NOT NULL CHECK (activity_type IN ('cardio', 'strength', 'flexibility', 'sports', 'other')),
        exercise_name   VARCHAR(255) NOT NULL,
        duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
        calories_burned INTEGER NOT NULL CHECK (calories_burned >= 0),
        intensity       VARCHAR(20) DEFAULT 'moderate' CHECK (intensity IN ('low', 'moderate', 'high', 'very_high')),
        notes           TEXT,
        external_id     VARCHAR(100), -- For exercises from external APIs
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_fitness_activities_user ON fitness_activities(user_id);
      CREATE INDEX IF NOT EXISTS idx_fitness_activities_date ON fitness_activities(date);
      CREATE INDEX IF NOT EXISTS idx_fitness_activities_user_date ON fitness_activities(user_id, date DESC);
      CREATE INDEX IF NOT EXISTS idx_fitness_activities_type ON fitness_activities(activity_type);

      DROP TRIGGER IF EXISTS trg_fitness_activities_updated_at ON fitness_activities;
      CREATE TRIGGER trg_fitness_activities_updated_at
      BEFORE UPDATE ON fitness_activities FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    /* =========== WORKOUT SESSIONS (completed workouts) =========== */
    await client.query(`
      CREATE TABLE IF NOT EXISTS workout_sessions (
        id                 INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id            INTEGER,
        workout_name       VARCHAR(255),
        plan_id            INTEGER,
        event_id           INTEGER,
        duration_seconds   INTEGER,
        completed_at       TIMESTAMPTZ,
        exercises_completed INTEGER,
        total_exercises     INTEGER,
        notes              TEXT,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Backfill/ensure expected columns with proper defaults and constraints
      ALTER TABLE workout_sessions
        ADD COLUMN IF NOT EXISTS user_id INTEGER,
        ADD COLUMN IF NOT EXISTS workout_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS plan_id INTEGER,
        ADD COLUMN IF NOT EXISTS event_id INTEGER,
        ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS exercises_completed INTEGER,
        ADD COLUMN IF NOT EXISTS total_exercises INTEGER,
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

      -- Ensure essential defaults/constraints (best-effort, idempotent)
      ALTER TABLE workout_sessions ALTER COLUMN workout_name SET NOT NULL;
      ALTER TABLE workout_sessions ALTER COLUMN duration_seconds SET NOT NULL;
      ALTER TABLE workout_sessions ALTER COLUMN duration_seconds SET DEFAULT 0;
      ALTER TABLE workout_sessions ALTER COLUMN completed_at SET NOT NULL;
      ALTER TABLE workout_sessions ALTER COLUMN completed_at SET DEFAULT NOW();

      -- Ensure a DATE column exists for fast grouping/streaks
      ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS date DATE;
      -- Ensure default for date
      ALTER TABLE workout_sessions ALTER COLUMN date SET DEFAULT (NOW()::date);
      -- Allow NULLs on date to avoid migration failures; app will write it from completed_at
      ALTER TABLE workout_sessions ALTER COLUMN date DROP NOT NULL;

  -- Remove any legacy calories column if present (we are not tracking calories here)
  ALTER TABLE workout_sessions DROP COLUMN IF EXISTS total_calories_burned;

      -- Create indexes (will succeed once columns exist)
      CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_workout_sessions_completed_at ON workout_sessions(completed_at);
      CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, completed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date);
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
