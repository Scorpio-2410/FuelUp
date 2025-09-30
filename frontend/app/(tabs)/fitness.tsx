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

export default function FitnessScreen() {
  const { list, loading, error, refresh } = useExerciseAPI();
  const { refreshing, handleRefresh } = useGlobalRefresh({
    tabName: "fitness",
    onInternalRefresh: refresh,
  });

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ExerciseListItem | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const src = Array.isArray(list) ? list : [];
    if (!q) return src;
    return src.filter((e) => e.name.toLowerCase().includes(q));
  }, [query, list]);

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <TopSearchBar
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery("")}
      />

      <RefreshScroll refreshing={refreshing} onRefresh={handleRefresh}>
        <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>
            Exercises
          </Text>
          <Text style={{ color: "#a1a1aa", marginTop: 4 }}>
            Tap any exercise to see the demo GIF and instructions.
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
    </View>
  );
}
