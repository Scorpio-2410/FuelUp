// backend/models/exerciseInstruction.js
const { pool } = require("../config/database");

const ExerciseInstruction = {
  async get(exerciseId, language = "en") {
    const { rows } = await pool.query(
      `SELECT id, exercise_id, format, steps_md, tips_md, video_url, video_sources, language,
              created_at, updated_at
         FROM exercise_instructions
        WHERE exercise_id = $1 AND language = $2
        LIMIT 1`,
      [exerciseId, language]
    );
    return rows[0] || null;
  },

  // Upsert by (exercise_id, language)
  async upsert(exerciseId, payload) {
    const language = (payload.language || "en").slice(0, 10);
    const allowedFormats = new Set(["text", "video", "both"]);
    const format = payload.format && allowedFormats.has(payload.format) ? payload.format : null;

    const { rows } = await pool.query(
      `INSERT INTO exercise_instructions
         (exercise_id, format, steps_md, tips_md, video_url, video_sources, language)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
       ON CONFLICT (exercise_id, language)
       DO UPDATE SET
         format = EXCLUDED.format,
         steps_md = EXCLUDED.steps_md,
         tips_md = EXCLUDED.tips_md,
         video_url = EXCLUDED.video_url,
         video_sources = EXCLUDED.video_sources,
         updated_at = NOW()
       RETURNING id, exercise_id, format, steps_md, tips_md, video_url, video_sources, language,
                 created_at, updated_at`,
      [
        exerciseId,
        format,
        payload.stepsMd ?? null,
        payload.tipsMd ?? null,
        payload.videoUrl ?? null,
        payload.videoSources ? JSON.stringify(payload.videoSources) : null,
        language,
      ]
    );
    return rows[0];
  },

  async remove(exerciseId, language = "en") {
    const { rowCount } = await pool.query(
      `DELETE FROM exercise_instructions
        WHERE exercise_id = $1 AND language = $2`,
      [exerciseId, language]
    );
    return rowCount > 0;
  },
};

module.exports = ExerciseInstruction;
