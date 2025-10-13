// StepsData: Contains fitness level data with motivational messages and scientific insights
// Provides step-based activity level classifications and guidance

export interface FitnessLevel {
  minSteps: number;
  maxSteps: number;
  activityLevel: string;
  stepRange: string;
  motivation: string;
  scientific: string;
  icon: string;
}

// Returns fitness levels data based on user's step count
export const getFitnessLevelsData = (userSteps: number): FitnessLevel[] => [
  {
    minSteps: 0,
    maxSteps: 2999,
    activityLevel: "Getting Started",
    stepRange: "<3,000",
    motivation: `You've started moving — that's already a win! Even 2,000 steps can help improve circulation and reduce sedentary time. Keep going — every step counts toward a healthier heart.`,
    scientific: "Research shows even light activity (1,500–3,000 steps) helps regulate blood sugar and lower triglyceride levels after sitting for long periods. Short walks every few hours can improve metabolism and mood (Harvard Health, 2023).",
    icon: "🌱"
  },
  {
    minSteps: 3000,
    maxSteps: 6999,
    activityLevel: "Building Momentum", 
    stepRange: "3,000-6,999",
    motivation: `You're building momentum — keep it steady! Light activity reduces risk of hypertension and boosts daily calorie burn (~120-200 kcal).`,
    scientific: "Light activity reduces risk of hypertension and boosts daily calorie burn (~120-200 kcal). Regular moderate activity can significantly reduce the risk of chronic diseases like heart disease and type 2 diabetes.",
    icon: "⚡"
  },
  {
    minSteps: 7000,
    maxSteps: 9999,
    activityLevel: "Healthy Baseline",
    stepRange: "7,000-9,999", 
    motivation: `Fantastic! You're in the healthy range. This level supports cardiovascular health, weight management, and improved mood.`,
    scientific: "Studies (JAMA, 2021) show 7,000+ steps/day lowers all-cause mortality by 50-70%. Achieving 7,000+ steps daily is associated with a significantly lower risk of premature mortality.",
    icon: "💚"
  },
  {
    minSteps: 10000,
    maxSteps: 11999,
    activityLevel: "Active Lifestyle",
    stepRange: "10,000-11,999",
    motivation: `Excellent consistency — your heart thanks you! This level burns ~400-500 kcal and supports cardiovascular fitness.`,
    scientific: "10,000 steps ≈ 400-500 kcal burned for average adults; supports cardiovascular fitness. This level of activity is often recommended for advanced fitness goals and active lifestyles.",
    icon: "💙"
  },
  {
    minSteps: 12000,
    maxSteps: Infinity,
    activityLevel: "Athlete Territory",
    stepRange: "12,000+",
    motivation: `You're on athlete territory — great endurance! This level optimizes overall well-being and demonstrates exceptional fitness commitment.`,
    scientific: "Associated with improved VO2 max and muscular endurance; beneficial for weight control. Exceeding 10,000 steps daily can further enhance metabolic health, bone density, and mental clarity.",
    icon: "🏆"
  }
];

