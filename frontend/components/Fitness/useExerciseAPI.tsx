// components/Fitness/useExerciseAPI.tsx
import { useCallback, useEffect, useState } from "react";
import { apiSearchExercises } from "../../constants/api";

export type ExerciseListItem = {
  id: string;
  name: string;
  bodyPart?: string;
};

export function useExerciseAPI(target?: string, q?: string) {
  const [list, setList] = useState<ExerciseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params =
        q && q.trim().length >= 2
          ? { q: q.trim().toLowerCase() }
          : target
          ? { target: target.toLowerCase() }
          : undefined;

      const res = await apiSearchExercises(params);
      const items = Array.isArray(res?.items) ? res.items : [];

      setList(
        items.map((x: any) => ({
          id: String(x.id),
          name: x.name ?? "Unnamed",
          bodyPart: x.bodyPart,
        }))
      );
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [target, q]);

  useEffect(() => {
    load();
  }, [load]);

  return { list, loading, error, refresh: () => load() };
}
