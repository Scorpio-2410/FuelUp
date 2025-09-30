// app/(tabs)/fitness.tsx
import { useMemo, useState, useEffect } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RefreshScroll from "../../components/RefreshScroll";
import { useGlobalRefresh } from "../../components/useGlobalRefresh";
import TopSearchBar from "../../components/TopSearchBar";
import CalendarShortcut from "../../components/Fitness/CalendarShortcut";
import ExerciseGrid from "../../components/Fitness/ExerciseGrid";
import {
  useExerciseAPI,
  ExerciseListItem,
} from "../../components/Fitness/useExerciseAPI";
import ExerciseDetailModal from "../../components/Fitness/ExerciseDetailModal";
import TargetFilterBar, {
  MUSCLE_GROUPS,
} from "../../components/Fitness/TargetFilterBar";

// small debounce hook to avoid hammering the API as you type
function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function FitnessScreen() {
  const [query, setQuery] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<string>(
    MUSCLE_GROUPS[0]
  );

  const debouncedQuery = useDebounced(query.trim().toLowerCase(), 300);

  // pass either debounced search or selected target
  const { list, loading, error, refresh } = useExerciseAPI(
    debouncedQuery ? undefined : selectedTarget,
    debouncedQuery || undefined
  );

  const { refreshing, handleRefresh } = useGlobalRefresh({
    tabName: "fitness",
    onInternalRefresh: refresh,
  });

  const [selected, setSelected] = useState<ExerciseListItem | null>(null);

  // server already returns searched/targeted list; no client-side filtering
  const data = list;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#0b0b0b" }}
      edges={["top"]}>
      <View style={{ paddingTop: 4 }}>
        <TopSearchBar
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery("")}
        />
        {!debouncedQuery && (
          <TargetFilterBar
            value={selectedTarget}
            onChange={setSelectedTarget}
          />
        )}
      </View>

      <RefreshScroll refreshing={refreshing} onRefresh={handleRefresh}>
        <View style={{ paddingHorizontal: 24, marginBottom: 12, marginTop: 6 }}>
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>
            Exercises
          </Text>
          <Text style={{ color: "#a1a1aa", marginTop: 4 }}>
            {debouncedQuery
              ? `Results for “${debouncedQuery}”.`
              : `Target: ${selectedTarget}. Tap any exercise for GIF and instructions.`}
          </Text>
        </View>

        <CalendarShortcut onPress={() => {}} />

        {loading ? (
          <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
            <Text style={{ color: "#a1a1aa" }}>Loading exercises…</Text>
          </View>
        ) : error ? (
          <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
            <Text style={{ color: "#ef4444" }}>
              Failed to load: {String(error)}
            </Text>
            <Text style={{ color: "#a1a1aa", marginTop: 4 }}>
              Pull to refresh and try again.
            </Text>
          </View>
        ) : null}

        <ExerciseGrid
          exercises={data}
          onExercisePress={(ex) => setSelected(ex)}
        />
      </RefreshScroll>

      <ExerciseDetailModal
        visible={!!selected}
        exercise={selected}
        onClose={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}
