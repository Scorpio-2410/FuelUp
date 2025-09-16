import { useMemo } from "react";

const fitnessImg = require("../../assets/images/fitness.png");

// Temporary component to hold exercise data as placeholder for API
export const useExerciseData = () => {
  const gymCategories = [
    "All",
    "Chest",
    "Back",
    "Legs",
    "Shoulders",
    "Arms",
    "Core",
    "Cardio",
  ];

  const homeCategories = [
    "All",
    "HIIT",
    "Sports",
    "Running",
    "Calisthenics",
    "Mobility",
    "Core",
  ];

  const exercisesGym = useMemo(
    () => [
      // Chest exercises
      {
        id: "1",
        name: "Bench Press",
        category: "Chest",
        image: fitnessImg,
      },
      {
        id: "2",
        name: "Incline Dumbbell Press",
        category: "Chest",
        image: fitnessImg,
      },
      {
        id: "3",
        name: "Chest Flyes",
        category: "Chest",
        image: fitnessImg,
      },
      {
        id: "4",
        name: "Dips",
        category: "Chest",
        image: fitnessImg,
      },
      // Back exercises
      {
        id: "5",
        name: "Deadlift",
        category: "Back",
        image: fitnessImg,
      },
      {
        id: "6",
        name: "Pull-ups",
        category: "Back",
        image: fitnessImg,
      },
      {
        id: "7",
        name: "Lat Pulldown",
        category: "Back",
        image: fitnessImg,
      },
      {
        id: "8",
        name: "Barbell Rows",
        category: "Back",
        image: fitnessImg,
      },
      {
        id: "9",
        name: "T-Bar Row",
        category: "Back",
        image: fitnessImg,
      },
      // Legs exercises
      {
        id: "10",
        name: "Squats",
        category: "Legs",
        image: fitnessImg,
      },
      {
        id: "11",
        name: "Leg Press",
        category: "Legs",
        image: fitnessImg,
      },
      {
        id: "12",
        name: "Lunges",
        category: "Legs",
        image: fitnessImg,
      },
      {
        id: "13",
        name: "Leg Curls",
        category: "Legs",
        image: fitnessImg,
      },
      {
        id: "14",
        name: "Calf Raises",
        category: "Legs",
        image: fitnessImg,
      },
      {
        id: "15",
        name: "Romanian Deadlift",
        category: "Legs",
        image: fitnessImg,
      },
      // Shoulders exercises
      {
        id: "16",
        name: "Shoulder Press",
        category: "Shoulders",
        image: fitnessImg,
      },
      {
        id: "17",
        name: "Lateral Raises",
        category: "Shoulders",
        image: fitnessImg,
      },
      {
        id: "18",
        name: "Rear Delt Flyes",
        category: "Shoulders",
        image: fitnessImg,
      },
      {
        id: "19",
        name: "Upright Rows",
        category: "Shoulders",
        image: fitnessImg,
      },
      {
        id: "20",
        name: "Arnold Press",
        category: "Shoulders",
        image: fitnessImg,
      },
      // Arms exercises
      {
        id: "21",
        name: "Bicep Curls",
        category: "Arms",
        image: fitnessImg,
      },
      {
        id: "22",
        name: "Tricep Extensions",
        category: "Arms",
        image: fitnessImg,
      },
      {
        id: "23",
        name: "Hammer Curls",
        category: "Arms",
        image: fitnessImg,
      },
      {
        id: "24",
        name: "Close-Grip Bench Press",
        category: "Arms",
        image: fitnessImg,
      },
      {
        id: "25",
        name: "Preacher Curls",
        category: "Arms",
        image: fitnessImg,
      },
      {
        id: "26",
        name: "Tricep Dips",
        category: "Arms",
        image: fitnessImg,
      },
      // Core exercises
      {
        id: "27",
        name: "Plank",
        category: "Core",
        image: fitnessImg,
      },
      {
        id: "28",
        name: "Russian Twists",
        category: "Core",
        image: fitnessImg,
      },
      {
        id: "29",
        name: "Cable Crunches",
        category: "Core",
        image: fitnessImg,
      },
      {
        id: "30",
        name: "Hanging Leg Raises",
        category: "Core",
        image: fitnessImg,
      },
      {
        id: "31",
        name: "Ab Wheel Rollouts",
        category: "Core",
        image: fitnessImg,
      },
      {
        id: "32",
        name: "Dead Bug",
        category: "Core",
        image: fitnessImg,
      },
      // Cardio exercises
      {
        id: "33",
        name: "Treadmill Running",
        category: "Cardio",
        image: fitnessImg,
      },
      {
        id: "34",
        name: "Stationary Bike",
        category: "Cardio",
        image: fitnessImg,
      },
      {
        id: "35",
        name: "Elliptical",
        category: "Cardio",
        image: fitnessImg,
      },
      {
        id: "36",
        name: "Rowing Machine",
        category: "Cardio",
        image: fitnessImg,
      },
      {
        id: "37",
        name: "Jump rope",
        category: "Cardio",
        image: fitnessImg,
      },
      {
        id: "38",
        name: "Battle Ropes",
        category: "Cardio",
        image: fitnessImg,
      },
      {
        id: "39",
        name: "Burpees",
        category: "Cardio",
        image: fitnessImg,
      },
      {
        id: "40",
        name: "Mountain Climbers",
        category: "Cardio",
        image: fitnessImg,
      },
    ],
    []
  );

  const exercisesHome = useMemo(
    () => [
      { id: "h1", name: "HIIT Circuit", category: "HIIT", image: fitnessImg },
      { id: "h2", name: "Park Run", category: "Running", image: fitnessImg },
      {
        id: "h3",
        name: "Football 5-a-side",
        category: "Sports",
        image: fitnessImg,
      },
      {
        id: "h4",
        name: "Pull-ups",
        category: "Calisthenics",
        image: fitnessImg,
      },
      { id: "h5", name: "Yoga Flow", category: "Mobility", image: fitnessImg },
      { id: "h6", name: "Core Blast", category: "Core", image: fitnessImg },
      { id: "h7", name: "Tennis", category: "Sports", image: fitnessImg },
      { id: "h8", name: "Basketball", category: "Sports", image: fitnessImg },
      {
        id: "h9",
        name: "Bodyweight Dips",
        category: "Calisthenics",
        image: fitnessImg,
      },
      { id: "h10", name: "Sprints", category: "Running", image: fitnessImg },
      {
        id: "h11",
        name: "Jump Rope Circuit",
        category: "HIIT",
        image: fitnessImg,
      },
      {
        id: "h12",
        name: "Resistance Band Workout",
        category: "Calisthenics",
        image: fitnessImg,
      },
    ],
    []
  );

  return {
    gymCategories,
    homeCategories,
    exercisesGym,
    exercisesHome,
  };
};
