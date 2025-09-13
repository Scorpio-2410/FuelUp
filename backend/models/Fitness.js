// models/Fitness.js
const { pool } = require("../config/database");

class Fitness {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;
    this.goal = row.goal;
    this.activityLevel = row.activity_level;
    this.experienceLevel = row.experience_level;
    this.daysPerWeek = row.days_per_week;
    this.sessionLengthMin = row.session_length_min;
    this.trainingLocation = row.training_location;
    this.equipmentAvailable = row.equipment_available
      ? JSON.parse(row.equipment_available)
      : [];
    this.preferredActivities = row.preferred_activities
      ? JSON.parse(row.preferred_activities)
      : [];
    this.injuriesOrLimitations = row.injuries_or_limitations;
    this.coachingStyle = row.coaching_style;
    this.updatedAt = row.updated_at;
  }

  static async findByUserId(userId) {
    const r = await pool.query("SELECT * FROM fitness WHERE user_id=$1", [
      userId,
    ]);
    return r.rows[0] ? new Fitness(r.rows[0]) : null;
  }

  static async upsert(userId, data) {
    const q = `
      INSERT INTO fitness (
        user_id, goal, activity_level, experience_level, days_per_week,
        session_length_min, training_location, equipment_available,
        preferred_activities, injuries_or_limitations, coaching_style
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (user_id) DO UPDATE SET
        goal = EXCLUDED.goal,
        activity_level = EXCLUDED.activity_level,
        experience_level = EXCLUDED.experience_level,
        days_per_week = EXCLUDED.days_per_week,
        session_length_min = EXCLUDED.session_length_min,
        training_location = EXCLUDED.training_location,
        equipment_available = EXCLUDED.equipment_available,
        preferred_activities = EXCLUDED.preferred_activities,
        injuries_or_limitations = EXCLUDED.injuries_or_limitations,
        coaching_style = EXCLUDED.coaching_style,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const v = [
      userId,
      data.goal || "general_health",
      data.activityLevel || "moderate",
      data.experienceLevel || null,
      data.daysPerWeek || null,
      data.sessionLengthMin || null,
      data.trainingLocation || null,
      JSON.stringify(data.equipmentAvailable || []),
      JSON.stringify(data.preferredActivities || []),
      data.injuriesOrLimitations || null,
      data.coachingStyle || null,
    ];
    const r = await pool.query(q, v);
    return new Fitness(r.rows[0]);
  }

  async update(updateData) {
    const allowed = [
      "goal",
      "activity_level",
      "experience_level",
      "days_per_week",
      "session_length_min",
      "training_location",
      "equipment_available",
      "preferred_activities",
      "injuries_or_limitations",
      "coaching_style",
    ];
    const sets = [];
    const vals = [];
    let i = 1;

    for (const col of allowed) {
      if (Object.prototype.hasOwnProperty.call(updateData, col)) {
        let val = updateData[col];
        if (col === "equipment_available" || col === "preferred_activities") {
          val = JSON.stringify(val || []);
        }
        sets.push(`${col}=$${i}`);
        vals.push(val);
        i++;
      }
    }
    if (!sets.length) throw new Error("No valid fields to update");

    vals.push(this.userId);
    const sql = `
      UPDATE fitness SET ${sets.join(", ")}, updated_at=CURRENT_TIMESTAMP
      WHERE user_id=$${i} RETURNING *`;
    const r = await pool.query(sql, vals);
    Object.assign(this, new Fitness(r.rows[0]));
    return this;
  }

  async delete() {
    await pool.query("DELETE FROM fitness WHERE user_id=$1", [this.userId]);
    return true;
  }

  // convenience suggestions
  getWorkoutRecommendations() {
    const rec = {
      beginner: { min: 2, max: 3, sessionLength: 45 },
      intermediate: { min: 3, max: 4, sessionLength: 60 },
      advanced: { min: 4, max: 6, sessionLength: 75 },
    };
    const intensity = {
      beginner: ["low", "moderate"],
      intermediate: ["moderate", "high"],
      advanced: ["moderate", "high", "very_high"],
    };
    const e = this.experienceLevel || "intermediate";
    const out = {
      frequency: rec[e] || rec.intermediate,
      intensity: intensity[e] || intensity.intermediate,
      workoutTypes: [],
      tips: [],
    };
    switch (this.goal) {
      case "weight_loss":
        out.workoutTypes = ["cardio", "hiit", "circuit_training"];
        out.tips = [
          "Use intervals for higher calorie burn",
          "Combine cardio and strength",
          "Stay consistent",
        ];
        break;
      case "muscle_gain":
        out.workoutTypes = ["strength_training", "compound_movements"];
        out.tips = ["Progressive overload", "Compound lifts", "Rest well"];
        break;
      case "endurance":
        out.workoutTypes = ["running", "cycling", "swimming"];
        out.tips = ["Increase duration gradually", "Mix steady + intervals"];
        break;
      default:
        out.workoutTypes = ["full_body", "cardio", "flexibility"];
        out.tips = [
          "Balance cardio/strength/flexibility",
          "Consistency > intensity",
        ];
    }
    return out;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      goal: this.goal,
      activityLevel: this.activityLevel,
      experienceLevel: this.experienceLevel,
      daysPerWeek: this.daysPerWeek,
      sessionLengthMin: this.sessionLengthMin,
      trainingLocation: this.trainingLocation,
      equipmentAvailable: this.equipmentAvailable,
      preferredActivities: this.preferredActivities,
      injuriesOrLimitations: this.injuriesOrLimitations,
      coachingStyle: this.coachingStyle,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Fitness;
