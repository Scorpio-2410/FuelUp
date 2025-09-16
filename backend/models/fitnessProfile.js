const { pool } = require("../config/database");

class FitnessProfile {
  constructor(row) {
    this.id = row.id;
    this.userId = row.user_id;

    this.heightCm = row.height_cm;
    this.weightKg = row.weight_kg;
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

  static async upsert(userId, data = {}) {
    const r = await pool.query(
      `
      INSERT INTO fitness_profiles (
        user_id, height_cm, weight_kg, goal, activity_level, experience_level,
        days_per_week, session_length_min, training_location,
        equipment_available, preferred_activities, injuries_or_limitations, coaching_style
      )
      VALUES ($1,$2,$3,COALESCE($4,'general_health'),COALESCE($5,'moderate'),$6,
              $7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (user_id) DO UPDATE SET
        height_cm             = COALESCE(EXCLUDED.height_cm, fitness_profiles.height_cm),
        weight_kg             = COALESCE(EXCLUDED.weight_kg, fitness_profiles.weight_kg),
        goal                  = COALESCE(EXCLUDED.goal, fitness_profiles.goal),
        activity_level        = COALESCE(EXCLUDED.activity_level, fitness_profiles.activity_level),
        experience_level      = COALESCE(EXCLUDED.experience_level, fitness_profiles.experience_level),
        days_per_week         = COALESCE(EXCLUDED.days_per_week, fitness_profiles.days_per_week),
        session_length_min    = COALESCE(EXCLUDED.session_length_min, fitness_profiles.session_length_min),
        training_location     = COALESCE(EXCLUDED.training_location, fitness_profiles.training_location),
        equipment_available   = COALESCE(EXCLUDED.equipment_available, fitness_profiles.equipment_available),
        preferred_activities  = COALESCE(EXCLUDED.preferred_activities, fitness_profiles.preferred_activities),
        injuries_or_limitations = COALESCE(EXCLUDED.injuries_or_limitations, fitness_profiles.injuries_or_limitations),
        coaching_style        = COALESCE(EXCLUDED.coaching_style, fitness_profiles.coaching_style),
        updated_at = NOW()
      RETURNING *`,
      [
        userId,
        data.heightCm ?? null,
        data.weightKg ?? null,
        data.goal || null,
        data.activityLevel || null,
        data.experienceLevel || null,
        data.daysPerWeek ?? null,
        data.sessionLengthMin ?? null,
        data.trainingLocation || null,
        data.equipmentAvailable
          ? JSON.stringify(data.equipmentAvailable)
          : null,
        data.preferredActivities
          ? JSON.stringify(data.preferredActivities)
          : null,
        data.injuriesOrLimitations || null,
        data.coachingStyle || null,
      ]
    );
    return new FitnessProfile(r.rows[0]);
  }

  static async findByUserId(userId) {
    const r = await pool.query(
      `SELECT * FROM fitness_profiles WHERE user_id=$1`,
      [userId]
    );
    return r.rows[0] ? new FitnessProfile(r.rows[0]) : null;
  }

  async update(patch) {
    const allowed = [
      "height_cm",
      "weight_kg",
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
      if (Object.prototype.hasOwnProperty.call(patch, col)) {
        let v = patch[col];
        if (
          (col === "equipment_available" || col === "preferred_activities") &&
          v &&
          typeof v !== "string"
        ) {
          v = JSON.stringify(v);
        }
        sets.push(`${col}=$${i}`);
        vals.push(v);
        i++;
      }
    }

    if (!sets.length) throw new Error("No valid fields to update");
    vals.push(this.userId);

    const r = await pool.query(
      `UPDATE fitness_profiles SET ${sets.join(", ")}, updated_at=NOW()
       WHERE user_id=$${i} RETURNING *`,
      vals
    );
    Object.assign(this, new FitnessProfile(r.rows[0]));
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      heightCm: this.heightCm,
      weightKg: this.weightKg,
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

module.exports = FitnessProfile;
