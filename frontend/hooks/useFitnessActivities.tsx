// Hook for managing fitness activities
import { useState, useEffect, useCallback } from "react";
import {
  apiCreateFitnessActivity,
  apiGetFitnessActivitiesByDate,
  apiGetFitnessActivitiesRange,
  apiUpdateFitnessActivity,
  apiDeleteFitnessActivity,
  FitnessActivity,
} from "../constants/api";

interface UseFitnessActivitiesOptions {
  date?: string; // YYYY-MM-DD format, defaults to today
  autoFetch?: boolean; // Whether to automatically fetch on mount
}

export function useFitnessActivities(
  options: UseFitnessActivitiesOptions = {}
) {
  const { date, autoFetch = true } = options;
  const targetDate = date || new Date().toISOString().split("T")[0];

  const [activities, setActivities] = useState<FitnessActivity[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(
    async (fetchDate?: string) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiGetFitnessActivitiesByDate(
          fetchDate || targetDate
        );

        if (response.success) {
          setActivities(response.activities);
          setTotalCalories(response.totalCalories);
        } else {
          setError("Failed to fetch activities");
        }
      } catch (err) {
        console.error("Error fetching activities:", err);
        setError("Failed to fetch activities");
      } finally {
        setLoading(false);
      }
    },
    [targetDate]
  );

  const createActivity = useCallback(
    async (data: {
      activityType: "cardio" | "strength" | "flexibility" | "sports" | "other";
      exerciseName: string;
      durationMinutes: number;
      caloriesBurned: number;
      intensity?: "low" | "moderate" | "high" | "very_high";
      notes?: string;
      externalId?: string;
    }) => {
      try {
        setError(null);
        const response = await apiCreateFitnessActivity({
          ...data,
          date: targetDate,
        });

        if (response.success) {
          setActivities((prev) => [response.activity, ...prev]);
          setTotalCalories((prev) => prev + response.activity.caloriesBurned);
          return { success: true, activity: response.activity };
        } else {
          setError("Failed to create activity");
          return { success: false, error: "Failed to create activity" };
        }
      } catch (err) {
        console.error("Error creating activity:", err);
        setError("Failed to create activity");
        return { success: false, error: "Failed to create activity" };
      }
    },
    [targetDate]
  );

  const updateActivity = useCallback(
    async (id: string | number, updates: Partial<FitnessActivity>) => {
      try {
        setError(null);
        const response = await apiUpdateFitnessActivity(id, updates);

        if (response.success) {
          setActivities((prev) =>
            prev.map((activity) =>
              activity.id === response.activity.id
                ? response.activity
                : activity
            )
          );

          // Recalculate total calories
          const newTotal = activities
            .map((activity) =>
              activity.id === response.activity.id
                ? response.activity
                : activity
            )
            .reduce((sum, activity) => sum + activity.caloriesBurned, 0);
          setTotalCalories(newTotal);

          return { success: true, activity: response.activity };
        } else {
          setError("Failed to update activity");
          return { success: false, error: "Failed to update activity" };
        }
      } catch (err) {
        console.error("Error updating activity:", err);
        setError("Failed to update activity");
        return { success: false, error: "Failed to update activity" };
      }
    },
    [activities]
  );

  const deleteActivity = useCallback(
    async (id: string | number) => {
      try {
        setError(null);
        const response = await apiDeleteFitnessActivity(id);

        if (response.success) {
          const activityToDelete = activities.find(
            (activity) => activity.id === id
          );
          if (activityToDelete) {
            setActivities((prev) =>
              prev.filter((activity) => activity.id !== id)
            );
            setTotalCalories((prev) => prev - activityToDelete.caloriesBurned);
          }
          return { success: true };
        } else {
          setError("Failed to delete activity");
          return { success: false, error: "Failed to delete activity" };
        }
      } catch (err) {
        console.error("Error deleting activity:", err);
        setError("Failed to delete activity");
        return { success: false, error: "Failed to delete activity" };
      }
    },
    [activities]
  );

  const refresh = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchActivities();
    }
  }, [fetchActivities, autoFetch]);

  return {
    activities,
    totalCalories,
    loading,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
    refresh,
    fetchActivities,
  };
}

// Hook for fetching activities in a date range
export function useFitnessActivitiesRange(startDate: string, endDate: string) {
  const [activities, setActivities] = useState<FitnessActivity[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRange = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGetFitnessActivitiesRange(startDate, endDate);

      if (response.success) {
        setActivities(response.activities);
        setTotalCalories(response.totalCalories);
      } else {
        setError("Failed to fetch activities");
      }
    } catch (err) {
      console.error("Error fetching activities range:", err);
      setError("Failed to fetch activities");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchRange();
  }, [fetchRange]);

  return {
    activities,
    totalCalories,
    loading,
    error,
    refresh: fetchRange,
  };
}
