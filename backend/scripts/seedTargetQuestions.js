const { pool } = require("../config/database");

// Categorized questions extracted from targetquestions.tsx
const questionsData = [
  // DAILY QUESTIONS - Mandatory (High Priority, High Influence)
  {
    type: 'daily',
    text: "What's our workout for today?",
    priority: 'high',
    frequency: 'mandatory',
    options: ["Strength", "Cardio", "Recovery", "Sorry, not today"],
    isSlider: false,
    sliderConfig: null,
    category: 'fitness',
    influenceWeight: 4.5
  },
  {
    type: 'daily',
    text: "Plans for our meals?",
    priority: 'high',
    frequency: 'mandatory',
    options: ["Low-carb", "High Protein", "Balanced", "Eating out", "Something different"],
    isSlider: false,
    sliderConfig: null,
    category: 'nutrition',
    influenceWeight: 4.2
  },
  {
    type: 'daily',
    text: "How's our energy levels today?",
    priority: 'high',
    frequency: 'mandatory',
    options: ["1", "2", "3", "4", "5"],
    isSlider: true,
    sliderConfig: {
      emojis: ["💤", "🥲", "😄", "⚡️", "🔥"],
      feedbackTexts: [
        "Not up for it today...",
        "So-so",
        "Feeling good!",
        "I'm raring to go!",
        "Let's do this!!"
      ],
      minValue: 1,
      maxValue: 5
    },
    category: 'wellness',
    influenceWeight: 4.0
  },

  // DAILY QUESTIONS - Rotational (Medium-High Priority)
  {
    type: 'daily',
    text: "How well are we sleeping?",
    priority: 'medium',
    frequency: 'rotational',
    options: ["Poorly", "Not bad", "Well", "Excellent!"],
    isSlider: false,
    sliderConfig: null,
    category: 'wellness',
    influenceWeight: 3.8
  },
  {
    type: 'daily',
    text: "How long do you want to exercise today?",
    priority: 'medium',
    frequency: 'rotational',
    options: ["Less than 30 minutes", "30-60 minutes", "60-90 minutes", "More than 90 minutes"],
    isSlider: false,
    sliderConfig: null,
    category: 'fitness',
    influenceWeight: 3.5
  },
  {
    type: 'daily',
    text: "What's is our stress level today?",
    priority: 'medium',
    frequency: 'rotational',
    options: ["1", "2", "3", "4"],
    isSlider: true,
    sliderConfig: {
      emojis: ["😵", "😰", "😐", "😌"],
      feedbackTexts: [
        "Overwhelmed!",
        "Feeling stressed",
        "Not so bad",
        "Chill"
      ],
      minValue: 1,
      maxValue: 4
    },
    category: 'wellness',
    influenceWeight: 3.2
  },
  {
    type: 'daily',
    text: "Are you feeling any soreness from your last workout?",
    priority: 'medium',
    frequency: 'rotational',
    options: ["Yes", "No"],
    isSlider: false,
    sliderConfig: null,
    category: 'fitness',
    influenceWeight: 2.8
  },

  // DAILY QUESTIONS - Optional (Medium Priority)
  {
    type: 'daily',
    text: "How do you feel about your progress so far?",
    priority: 'medium',
    frequency: 'optional',
    options: ["Slow", "Just right", "Fast", "Amazing!"],
    isSlider: false,
    sliderConfig: null,
    category: 'motivation',
    influenceWeight: 2.5
  },
  {
    type: 'daily',
    text: "Do have any food cravings today?",
    priority: 'low',
    frequency: 'optional',
    options: ["Sweets", "Savoury", "None"],
    isSlider: false,
    sliderConfig: null,
    category: 'nutrition',
    influenceWeight: 2.0
  },
  {
    type: 'daily',
    text: "How would you rate your hydration today?",
    priority: 'low',
    frequency: 'optional',
    options: ["Low", "Just right", "High"],
    isSlider: false,
    sliderConfig: null,
    category: 'wellness',
    influenceWeight: 1.8
  },

  // WEEKLY QUESTIONS - Mandatory (High Priority)
  {
    type: 'weekly',
    text: "How satisfied are you with your workout routine this week?",
    priority: 'high',
    frequency: 'mandatory',
    options: ["1", "2", "3", "4", "5"],
    isSlider: true,
    sliderConfig: {
      emojis: ["😞", "😐", "🙂", "😊", "🤩"],
      feedbackTexts: [
        "Need major changes",
        "Some improvements needed",
        "It's okay",
        "Pretty satisfied",
        "Love it!"
      ],
      minValue: 1,
      maxValue: 5
    },
    category: 'fitness',
    influenceWeight: 4.0
  },
  {
    type: 'weekly',
    text: "How consistent were you with your meal planning this week?",
    priority: 'high',
    frequency: 'mandatory',
    options: ["1", "2", "3", "4", "5"],
    isSlider: true,
    sliderConfig: {
      emojis: ["😫", "😕", "😐", "😊", "💪"],
      feedbackTexts: [
        "Barely stuck to it",
        "Struggled a bit",
        "Average consistency",
        "Pretty consistent",
        "Nailed it!"
      ],
      minValue: 1,
      maxValue: 5
    },
    category: 'nutrition',
    influenceWeight: 3.8
  },

  // WEEKLY QUESTIONS - Rotational
  {
    type: 'weekly',
    text: "What fitness goals would you like to focus on next week?",
    priority: 'medium',
    frequency: 'rotational',
    options: ["Strength building", "Weight loss", "Endurance", "Flexibility", "Recovery"],
    isSlider: false,
    sliderConfig: null,
    category: 'fitness',
    influenceWeight: 3.5
  },
  {
    type: 'weekly',
    text: "How many days did you achieve your workout goals this week?",
    priority: 'medium',
    frequency: 'rotational',
    options: ["0-1 days", "2-3 days", "4-5 days", "6-7 days"],
    isSlider: false,
    sliderConfig: null,
    category: 'fitness',
    influenceWeight: 3.2
  },
  {
    type: 'weekly',
    text: "What nutrition aspect needs more attention?",
    priority: 'medium',
    frequency: 'rotational',
    options: ["Portion control", "Protein intake", "Vegetable intake", "Hydration", "Meal timing"],
    isSlider: false,
    sliderConfig: null,
    category: 'nutrition',
    influenceWeight: 3.0
  },

  // MONTHLY QUESTIONS - Mandatory (High Priority, High Influence)
  {
    type: 'monthly',
    text: "How do you feel about your overall fitness progress this month?",
    priority: 'high',
    frequency: 'mandatory',
    options: ["1", "2", "3", "4", "5"],
    isSlider: true,
    sliderConfig: {
      emojis: ["😔", "😕", "😐", "😊", "🎉"],
      feedbackTexts: [
        "Not seeing progress",
        "Slow progress",
        "Some progress",
        "Good progress",
        "Excellent progress!"
      ],
      minValue: 1,
      maxValue: 5
    },
    category: 'fitness',
    influenceWeight: 4.5
  },
  {
    type: 'monthly',
    text: "What major changes would you like to make to your routine?",
    priority: 'high',
    frequency: 'mandatory',
    options: ["More cardio", "More strength training", "Better nutrition", "More rest", "New activities"],
    isSlider: false,
    sliderConfig: null,
    category: 'general',
    influenceWeight: 4.2
  },
  {
    type: 'monthly',
    text: "How motivated are you to continue your fitness journey?",
    priority: 'high',
    frequency: 'mandatory',
    options: ["1", "2", "3", "4", "5"],
    isSlider: true,
    sliderConfig: {
      emojis: ["😞", "😐", "🙂", "😊", "🔥"],
      feedbackTexts: [
        "Need motivation boost",
        "Somewhat motivated",
        "Moderately motivated",
        "Very motivated",
        "Extremely motivated!"
      ],
      minValue: 1,
      maxValue: 5
    },
    category: 'motivation',
    influenceWeight: 4.0
  },

  // MONTHLY QUESTIONS - Rotational
  {
    type: 'monthly',
    text: "What new fitness activities would you like to try?",
    priority: 'medium',
    frequency: 'rotational',
    options: ["Yoga", "Swimming", "Rock climbing", "Dancing", "Martial arts", "None"],
    isSlider: false,
    sliderConfig: null,
    category: 'fitness',
    influenceWeight: 2.5
  },
  {
    type: 'monthly',
    text: "How would you rate your overall energy levels this month?",
    priority: 'medium',
    frequency: 'rotational',
    options: ["1", "2", "3", "4", "5"],
    isSlider: true,
    sliderConfig: {
      emojis: ["😴", "😑", "😐", "⚡", "🔋"],
      feedbackTexts: [
        "Very low energy",
        "Below average",
        "Average energy",
        "High energy",
        "Extremely energetic!"
      ],
      minValue: 1,
      maxValue: 5
    },
    category: 'wellness',
    influenceWeight: 3.5
  },

  // Additional variety questions for different scenarios
  {
    type: 'daily',
    text: "What type of workout intensity feels right today?",
    priority: 'low',
    frequency: 'occasional',
    options: ["Light", "Moderate", "Intense", "Maximum effort"],
    isSlider: false,
    sliderConfig: null,
    category: 'fitness',
    influenceWeight: 2.2
  },
  {
    type: 'weekly',
    text: "How many hours of sleep did you average this week?",
    priority: 'medium',
    frequency: 'occasional',
    options: ["Less than 6", "6-7 hours", "7-8 hours", "More than 8"],
    isSlider: false,
    sliderConfig: null,
    category: 'wellness',
    influenceWeight: 2.8
  },
  {
    type: 'monthly',
    text: "What rewards would motivate you most for achieving your goals?",
    priority: 'low',
    frequency: 'rare',
    options: ["New workout gear", "Cheat meal", "Rest day", "New activity", "Achievement badge"],
    isSlider: false,
    sliderConfig: null,
    category: 'motivation',
    influenceWeight: 1.5
  }
];

const seedTargetQuestions = async () => {
  const client = await pool.connect();
  try {
    console.log("Starting to seed target questions...");
    
    // Check if questions already exist
    const existingCount = await client.query('SELECT COUNT(*) FROM target_questions');
    if (parseInt(existingCount.rows[0].count) > 0) {
      console.log("Target questions already exist. Skipping seed...");
      return;
    }

    await client.query('BEGIN');
    
    let insertedCount = 0;
    for (const question of questionsData) {
      const result = await client.query(
        `INSERT INTO target_questions 
         (type, text, priority, frequency, options, is_slider, slider_config, category, influence_weight)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          question.type,
          question.text,
          question.priority,
          question.frequency,
          JSON.stringify(question.options),
          question.isSlider,
          question.sliderConfig ? JSON.stringify(question.sliderConfig) : null,
          question.category,
          question.influenceWeight
        ]
      );
      insertedCount++;
      console.log(`Inserted question ${insertedCount}: "${question.text.substring(0, 50)}..."`);
    }
    
    await client.query('COMMIT');
    console.log(`Successfully seeded ${insertedCount} target questions!`);
    
    // Show summary
    const summary = await client.query(`
      SELECT type, frequency, priority, COUNT(*) as count 
      FROM target_questions 
      GROUP BY type, frequency, priority 
      ORDER BY type, frequency, priority
    `);
    
    console.log("\nSeed Summary:");
    console.table(summary.rows);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error seeding target questions:", error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the seed function if this script is executed directly
if (require.main === module) {
  seedTargetQuestions()
    .then(() => {
      console.log("Seed completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}

module.exports = { seedTargetQuestions, questionsData };
