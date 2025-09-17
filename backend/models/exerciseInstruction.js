const { pool } = require("../config/database");

class ExerciseInstruction {
  constructor(row) {
    this.id = row.id;
    this.exerciseId = row.exercise_id;

    this.format = row.format;            // 'text' | 'video' | 'both' | null
    this.stepsMd = row.steps_md || null;
    this.tipsMd = row.tips_md || null;
    this.videoUrl = row.video_url || null;
    this.videoSources = row.video_sources || null; // JSONB (object/array) or null
    this.language = row.language || "en";

    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  // ---------- helpers ----------
  static normaliseFormat({ format, stepsMd, videoUrl, videoSources }) {
    if (format && ["text", "video", "both"].includes(format)) return format;
    const hasText = !!stepsMd;
    const hasVideo = !!videoUrl || !!videoSources;
    if (hasText && hasVideo) return "both";
    if (hasText) return "text";
    if (hasVideo) return "video";
    return null; // let DB accept null or fail validation in controller
  }

  toJSON() {
    return {
      id: this.id,
      exerciseId: this.exerciseId,
      format: this.format,
      stepsMd: this.stepsMd,
      tipsMd: this.tipsMd,
      videoUrl: this.videoUrl,
      videoSources: this.videoSources,
      language: this.language,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // ---------- reads ----------
  static async findById(id) {
    const r = await pool.query(`SELECT * FROM exercise_instructions WHERE id=$1`, [id]);
    return r.rows[0] ? new ExerciseInstruction(r.rows[0]) : null;
  }

  /**
   * If language provided → return single instruction for that language (or null).
   * If no language → return all instructions for the exercise (array).
   */
  static async findByExercise(exerciseId, { language } = {}) {
    if (language) {
      const r = await pool.query(
        `SELECT * FROM exercise_instructions
         WHERE exercise_id=$1 AND language=$2
         ORDER BY id DESC
         LIMIT 1`,
        [exerciseId, language]
      );
      return r.rows[0] ? new ExerciseInstruction(r.rows[0]) : null;
    }
    const r = await pool.query(
      `SELECT * FROM exercise_instructions
       WHERE exercise_id=$1
       ORDER BY language ASC, id ASC`,
      [exerciseId]
    );
    return r.rows.map(row => new ExerciseInstruction(row));
  }

  // ---------- writes ----------
  static async create(exerciseId, data = {}) {
    const format = ExerciseInstruction.normaliseFormat(data);
    if (!data.stepsMd && !data.videoUrl && !data.videoSources) {
      throw new Error("Instruction must include stepsMd or a video (videoUrl/videoSources)");
    }

    const r = await pool.query(
      `INSERT INTO exercise_instructions
        (exercise_id, format, steps_md, tips_md, video_url, video_sources, language)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,'en'))
       RETURNING *`,
      [
        exerciseId,
        format,
        data.stepsMd || null,
        data.tipsMd || null,
        data.videoUrl || null,
        // JSONB – pg will serialise objects/arrays automatically
        data.videoSources ?? null,
        data.language || null,
      ]
    );
    return new ExerciseInstruction(r.rows[0]);
  }

  async update(patch = {}) {
    // If caller didn’t pass format but did change text/video fields, recompute format
    if (
      !("format" in patch) &&
      ("stepsMd" in patch || "videoUrl" in patch || "videoSources" in patch)
    ) {
      const next = {
        format: this.format,
        stepsMd: ("stepsMd" in patch) ? patch.stepsMd : this.stepsMd,
        videoUrl: ("videoUrl" in patch) ? patch.videoUrl : this.videoUrl,
        videoSources: ("videoSources" in patch) ? patch.videoSources : this.videoSources,
      };
      patch.format = ExerciseInstruction.normaliseFormat(next);
    }

    const map = {
      format: "format",
      stepsMd: "steps_md",
      tipsMd: "tips_md",
      videoUrl: "video_url",
      videoSources: "video_sources", // pass object/array directly for JSONB
      language: "language",
    };

    const sets = [];
    const vals = [];
    let i = 1;
    for (const k of Object.keys(map)) {
      if (Object.prototype.hasOwnProperty.call(patch, k)) {
        sets.push(`${map[k]}=$${i}`);
        vals.push(patch[k] ?? null);
        i++;
      }
    }
    if (!sets.length) throw new Error("No valid fields to update");

    vals.push(this.id);
    const r = await pool.query(
      `UPDATE exercise_instructions
       SET ${sets.join(", ")}, updated_at=NOW()
       WHERE id=$${i}
       RETURNING *`,
      vals
    );
    Object.assign(this, new ExerciseInstruction(r.rows[0]));
    return this;
  }

  async delete() {
    await pool.query(`DELETE FROM exercise_instructions WHERE id=$1`, [this.id]);
    return true;
  }
}

module.exports = ExerciseInstruction;
