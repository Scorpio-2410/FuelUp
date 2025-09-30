// app/(tabs)/fitness.tsx
import { useMemo, useState } from "react";
import { View, Text } from "react-native";
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
  // Default to "abs"
  const [selectedTarget, setSelectedTarget] = useState<string>(
    MUSCLE_GROUPS[1]
  );

  // Pass the selected target directly (no "all" option anymore)
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
    <View style={{ flex: 1, backgroundColor: "#0b0b0b" }}>
      {/* Search */}
      <TopSearchBar
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery("")}
      />

      {/* Horizontal chip selector (no "All") */}
      <TargetFilterBar value={selectedTarget} onChange={setSelectedTarget} />

      <RefreshScroll refreshing={refreshing} onRefresh={handleRefresh}>
        {/* Header */}
        <View style={{ paddingHorizontal: 24, marginBottom: 12, marginTop: 6 }}>
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800" }}>
            Exercises
          </Text>
          <Text style={{ color: "#a1a1aa", marginTop: 4 }}>
            Target: {selectedTarget}. Tap any exercise for GIF and instructions.
          </Text>
        </View>

        <CalendarShortcut onPress={() => {}} />

        {/* States */}
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

        {/* Grid */}
        <ExerciseGrid
          exercises={filtered}
          onExercisePress={(ex) => setSelected(ex)}
        />
      </RefreshScroll>

      {/* Detail modal */}
      <ExerciseDetailModal
        visible={!!selected}
        exercise={selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}
