-- Create workout_sessions table for tracking completed workouts
-- Run this migration to add the workout_sessions table

CREATE TABLE IF NOT EXISTS workout_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_name VARCHAR(255) NOT NULL,
  plan_id INTEGER REFERENCES fitness_plans(id) ON DELETE SET NULL,
  event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
  duration_seconds INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exercises_completed INTEGER DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);

-- Index for date-based queries (streaks, history)
CREATE INDEX IF NOT EXISTS idx_workout_sessions_completed_at ON workout_sessions(completed_at);

-- Index for user + date queries
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, completed_at DESC);

-- Comments
COMMENT ON TABLE workout_sessions IS 'Tracks completed workout sessions for history and streak tracking';
COMMENT ON COLUMN workout_sessions.user_id IS 'User who completed the workout';
COMMENT ON COLUMN workout_sessions.workout_name IS 'Name of the workout/plan';
COMMENT ON COLUMN workout_sessions.plan_id IS 'Reference to fitness plan if applicable';
COMMENT ON COLUMN workout_sessions.event_id IS 'Reference to calendar event if applicable';
COMMENT ON COLUMN workout_sessions.duration_seconds IS 'Time taken to complete workout in seconds';
COMMENT ON COLUMN workout_sessions.completed_at IS 'Date and time when workout was completed';
COMMENT ON COLUMN workout_sessions.exercises_completed IS 'Number of exercises marked as complete';
COMMENT ON COLUMN workout_sessions.total_exercises IS 'Total number of exercises in the workout';
