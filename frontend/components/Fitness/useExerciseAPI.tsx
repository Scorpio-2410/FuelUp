// API-based exercise data hook - replaces static ExerciseData
import { useState, useEffect, useCallback } from "react";
import { apiGetExercises, apiGetExerciseCategories } from "../../constants/api";

const fitnessImg = require("../../assets/images/fitness.png");

export interface ExerciseCategory {
  id: number;
  name: string;
  type: string;
  description?: string;
  isGymExercise: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  categoryId?: number;
  categoryInfo?: ExerciseCategory;
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
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic categories based on API data
  const gymCategories = [
    "All",
    ...categories.filter((c) => c.isGymExercise).map((c) => c.name),
  ];
  const homeCategories = [
    "All",
    ...categories.filter((c) => !c.isGymExercise).map((c) => c.name),
  ];

  // Transform API exercise to match frontend format
  const transformExercise = (apiExercise: any): Exercise => ({
    id: apiExercise.id.toString(),
    name: apiExercise.name || "Unnamed Exercise",
    category: apiExercise.category?.name || apiExercise.muscleGroup || "Other",
    categoryId: apiExercise.categoryId,
    categoryInfo: apiExercise.category,
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

  // Load categories from API
  const loadCategories = useCallback(async () => {
    try {
      const response = await apiGetExerciseCategories();
      if (response.success && Array.isArray(response.categories)) {
        setCategories(response.categories);
      }
    } catch (err: any) {
      console.warn("Failed to load categories from API:", err.message);
      // Use empty categories on error
      setCategories([]);
    }
  }, []);

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
    loadCategories();
    loadExercises();
  }, [loadCategories, loadExercises]);

  // Filter exercises by gym/home context based on category
  const exercisesGym = exercises.filter((exercise) => {
    // Show ONLY exercises that have gym categories (isGymExercise = true)
    return exercise.categoryInfo && exercise.categoryInfo.isGymExercise;
  });

  const exercisesHome = exercises.filter((exercise) => {
    // Show ONLY exercises that have non-gym categories (isGymExercise = false)
    return exercise.categoryInfo && !exercise.categoryInfo.isGymExercise;
  });

  // Refresh function for pull-to-refresh
  const refresh = () => {
    loadCategories();
    loadExercises(true);
  };

  return {
    // Categories
    gymCategories,
    homeCategories,
    allCategories: categories,

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
    loadCategories,
  };
};
