// API-based exercise data hook - replaces static ExerciseData
import { useState, useEffect, useCallback } from "react";
import { apiGetExercises } from "../../constants/api";

const fitnessImg = require("../../assets/images/fitness.png");

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup?: string;
  equipment?: string;
  difficulty?: string;
  sets?: number;
  reps?: number;
  durationMin?: number;
  restSeconds?: number;
  notes?: string;
  image: any; // We'll use default image for now
}

export const useExerciseAPI = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Categories based on muscle groups
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

  // Transform API exercise to match frontend format
  const transformExercise = (apiExercise: any): Exercise => ({
    id: apiExercise.id.toString(),
    name: apiExercise.name || "Unnamed Exercise",
    category: apiExercise.muscleGroup || "Other",
    muscleGroup: apiExercise.muscleGroup,
    equipment: apiExercise.equipment,
    difficulty: apiExercise.difficulty,
    sets: apiExercise.sets,
    reps: apiExercise.reps,
    durationMin: apiExercise.durationMin,
    restSeconds: apiExercise.restSeconds,
    notes: apiExercise.notes,
    image: fitnessImg, // Default image for all exercises
  });

  // Load exercises from API
  const loadExercises = useCallback(async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await apiGetExercises({
        limit: 100, // Get more exercises to have good variety
        offset: 0,
      });

      if (response.success && Array.isArray(response.exercises)) {
        const transformedExercises = response.exercises.map(transformExercise);
        setExercises(transformedExercises);
      } else {
        // Fallback to empty array if no exercises
        setExercises([]);
      }
    } catch (err: any) {
      console.warn("Failed to load exercises from API:", err.message);
      setError(err.message);
      // Keep any existing exercises on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  // Filter exercises by gym/home context
  // For now, we'll show all exercises for both contexts
  // Later we can add equipment-based filtering
  const exercisesGym = exercises;
  const exercisesHome = exercises.filter(
    (exercise) =>
      // Filter for home exercises based on equipment or category
      !exercise.equipment ||
      exercise.equipment.toLowerCase().includes("bodyweight") ||
      exercise.equipment.toLowerCase().includes("none") ||
      exercise.category === "HIIT" ||
      exercise.category === "Core" ||
      exercise.category === "Calisthenics"
  );

  // Refresh function for pull-to-refresh
  const refresh = () => loadExercises(true);

  return {
    // Categories
    gymCategories,
    homeCategories,

    // Exercise data
    exercisesGym,
    exercisesHome,
    allExercises: exercises,

    // Loading states
    loading,
    refreshing,
    error,

    // Actions
    refresh,
    loadExercises,
  };
};
