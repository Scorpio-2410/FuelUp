const { pool } = require("../config/database");

class TargetQuestion {
  constructor(row) {
    this.id = row.id;
    this.type = row.type;
    this.text = row.text;
    this.priority = row.priority;
    this.frequency = row.frequency;
    this.options = row.options;
    this.isSlider = row.is_slider;
    this.sliderConfig = row.slider_config;
    this.category = row.category;
    this.influenceWeight = parseFloat(row.influence_weight);
    this.createdAt = row.created_at;
    this.updatedAt = row.updated_at;
  }

  static async create(data) {
    const r = await pool.query(
      `INSERT INTO target_questions
        (type, text, priority, frequency, options, is_slider, slider_config, 
         category, influence_weight)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        data.type,
        data.text,
        data.priority || 'medium',
        data.frequency || 'mandatory',
        JSON.stringify(data.options || []),
        data.isSlider || false,
        data.sliderConfig ? JSON.stringify(data.sliderConfig) : null,
        data.category || 'general',
        data.influenceWeight || 1.0,
      ]
    );
    return new TargetQuestion(r.rows[0]);
  }

  static async findById(id) {
    const r = await pool.query(`SELECT * FROM target_questions WHERE id=$1`, [id]);
    return r.rows[0] ? new TargetQuestion(r.rows[0]) : null;
  }

  static async findByType(type, { priority = null, frequency = null, limit = 50, offset = 0 } = {}) {
    let query = `SELECT * FROM target_questions WHERE type = $1`;
    const params = [type];
    let paramIndex = 2;

    if (priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (frequency) {
      query += ` AND frequency = $${paramIndex}`;
      params.push(frequency);
      paramIndex++;
    }

    query += ` ORDER BY influence_weight DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const r = await pool.query(query, params);
    return r.rows.map((row) => new TargetQuestion(row));
  }

  static async findAll({ type = null, priority = null, frequency = null, limit = 50, offset = 0 } = {}) {
    let query = `SELECT * FROM target_questions WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (frequency) {
      query += ` AND frequency = $${paramIndex}`;
      params.push(frequency);
      paramIndex++;
    }

    query += ` ORDER BY type, influence_weight DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const r = await pool.query(query, params);
    return r.rows.map((row) => new TargetQuestion(row));
  }

  // Get questions for a user based on their follow_up_frequency and intelligent selection
  static async getQuestionsForUser(userId, userFrequency) {
    // Get user's recent responses to avoid repetition
    const recentResponses = await pool.query(
      `SELECT question_id, COUNT(*) as response_count, MAX(asked_at) as last_asked
       FROM user_question_responses 
       WHERE user_id = $1 AND asked_at > NOW() - INTERVAL '1 day'
       GROUP BY question_id`,
      [userId]
    );

    const recentQuestionIds = recentResponses.rows.map(row => row.question_id);
    
    // Determine question type based on user's frequency setting
    let questionType;
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = now.getDate();

    if (userFrequency === 'daily') {
      questionType = 'daily';
    } else if (userFrequency === 'weekly' && dayOfWeek === 1) { // Monday
      questionType = 'weekly';
    } else if (userFrequency === 'monthly' && dayOfMonth === 1) { // First of month
      questionType = 'monthly';
    } else {
      questionType = 'daily'; // Default fallback
    }

    // Check if user has already answered questions today based on their frequency
    let timeInterval;
    if (userFrequency === 'daily') {
      timeInterval = 'TODAY';
    } else if (userFrequency === 'weekly') {
      timeInterval = 'THIS WEEK';
    } else if (userFrequency === 'monthly') {
      timeInterval = 'THIS MONTH';
    } else {
      timeInterval = 'TODAY';
    }

    // Check for today's responses (for daily users)
    if (userFrequency === 'daily') {
      const todayResponses = await pool.query(
        `SELECT COUNT(*) as today_count
         FROM user_question_responses 
         WHERE user_id = $1 AND DATE(asked_at) = CURRENT_DATE`,
        [userId]
      );
      
      if (parseInt(todayResponses.rows[0].today_count) > 0) {
        return { questions: [], alreadyAnswered: true, timeframe: 'today' };
      }
    }

    // Get mandatory questions first
    let mandatoryQuestions = await TargetQuestion.findByType(questionType, { 
      frequency: 'mandatory' 
    });

    // Filter out recently asked questions
    mandatoryQuestions = mandatoryQuestions.filter(q => 
      !recentQuestionIds.includes(q.id)
    );

    // Get rotational questions (select some randomly)
    let rotationalQuestions = await TargetQuestion.findByType(questionType, { 
      frequency: 'rotational' 
    });
    rotationalQuestions = rotationalQuestions.filter(q => 
      !recentQuestionIds.includes(q.id)
    );

    // Shuffle and limit rotational questions
    rotationalQuestions = rotationalQuestions
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(2, rotationalQuestions.length));

    // Get optional questions based on probability
    let optionalQuestions = await TargetQuestion.findByType(questionType, { 
      frequency: 'optional' 
    });
    optionalQuestions = optionalQuestions.filter(q => 
      !recentQuestionIds.includes(q.id)
    );

    // 30% chance to include optional questions
    if (Math.random() < 0.3) {
      optionalQuestions = optionalQuestions
        .sort(() => 0.5 - Math.random())
        .slice(0, 1);
    } else {
      optionalQuestions = [];
    }

    // Combine all selected questions
    const selectedQuestions = [
      ...mandatoryQuestions.slice(0, 3), // Limit mandatory questions
      ...rotationalQuestions,
      ...optionalQuestions
    ];

    // Sort by influence weight and priority
    const sortedQuestions = selectedQuestions.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.influenceWeight - a.influenceWeight;
    });

    return { questions: sortedQuestions, alreadyAnswered: false, timeframe: null };
  }

  async update(patch) {
    const allowed = [
      "text",
      "priority",
      "frequency",
      "options",
      "is_slider",
      "slider_config",
      "category",
      "influence_weight",
    ];

    const sets = [];
    const vals = [];
    let i = 1;

    for (const col of allowed) {
      if (Object.prototype.hasOwnProperty.call(patch, col)) {
        if (col === 'options' || col === 'slider_config') {
          sets.push(`${col}=$${i}`);
          vals.push(patch[col] ? JSON.stringify(patch[col]) : null);
        } else {
          sets.push(`${col}=$${i}`);
          vals.push(patch[col]);
        }
        i++;
      }
    }
    
    if (!sets.length) throw new Error("No valid fields to update");

    vals.push(this.id);
    const r = await pool.query(
      `UPDATE target_questions SET ${sets.join(
        ", "
      )}, updated_at=NOW() WHERE id=$${i} RETURNING *`,
      vals
    );
    Object.assign(this, new TargetQuestion(r.rows[0]));
    return this;
  }

  async delete() {
    await pool.query(`DELETE FROM target_questions WHERE id=$1`, [this.id]);
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      text: this.text,
      priority: this.priority,
      frequency: this.frequency,
      options: this.options,
      isSlider: this.isSlider,
      sliderConfig: this.sliderConfig,
      category: this.category,
      influenceWeight: this.influenceWeight,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = TargetQuestion;
