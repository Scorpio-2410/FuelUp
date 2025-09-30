// components/Fitness/useExerciseAPI.tsx
import { useCallback, useEffect, useState } from "react";
import { apiSearchExercises } from "../../constants/api";

export type ExerciseListItem = {
  id: string; // ExerciseDB id (e.g., "0001")
  name: string; // display name
  bodyPart?: string; // category label in grid
};

export function useExerciseAPI(target?: string) {
  const [list, setList] = useState<ExerciseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure API gets lowercase target (ExerciseDB is case-sensitive)
      const res = await apiSearchExercises(
        target ? { target: target.toLowerCase() } : undefined
      );
      const items = Array.isArray(res?.items) ? res.items : [];

      const mapped: ExerciseListItem[] = items.map((x: any) => ({
        id: String(x.id),
        name: x.name ?? "Unnamed",
        bodyPart: x.bodyPart,
      }));

      setList(mapped);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [target]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    list,
    loading,
    error,
    refresh: () => load(),
  };
}
