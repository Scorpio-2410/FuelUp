// app/(tabs)/fitness.tsx
import { useMemo, useState } from "react";
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

export default function FitnessScreen() {
  const [query, setQuery] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<string>(
    MUSCLE_GROUPS[0]
  );

  const { list, loading, error, refresh } = useExerciseAPI(selectedTarget);
  const { refreshing, handleRefresh } = useGlobalRefresh({
    tabName: "fitness",
    onInternalRefresh: refresh,
  });

  const [selected, setSelected] = useState<ExerciseListItem | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const src = Array.isArray(list) ? list : [];
    if (!q) return src;
    return src.filter((e) => e.name.toLowerCase().includes(q));
  }, [query, list]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#0b0b0b" }}
      edges={["top"]}>
      {/* Keep content snug under the notch/Dynamic Island without being too low */}
      <View style={{ paddingTop: 4 }}>
        <TopSearchBar
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery("")}
        />

        <TargetFilterBar value={selectedTarget} onChange={setSelectedTarget} />
      </View>

      <RefreshScroll refreshing={refreshing} onRefresh={handleRefresh}>
        <View style={{ paddingHorizontal: 24, marginBottom: 12, marginTop: 6 }}>
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>
            Exercises
          </Text>
          <Text style={{ color: "#a1a1aa", marginTop: 4 }}>
            Target: {selectedTarget}. Tap any exercise for GIF and instructions.
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
          exercises={filtered}
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
