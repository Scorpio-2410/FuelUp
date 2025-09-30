// app/(tabs)/fitness.tsx
import { useMemo, useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import RefreshScroll from "../../components/RefreshScroll";
import { useGlobalRefresh } from "../../components/useGlobalRefresh";
import TopSearchBar from "../../components/TopSearchBar";
import ExerciseGrid from "../../components/Fitness/ExerciseGrid";
import {
  useExerciseAPI,
  ExerciseListItem,
} from "../../components/Fitness/useExerciseAPI";
import ExerciseDetailModal from "../../components/Fitness/ExerciseDetailModal";
import TargetFilterBar, {
  MUSCLE_GROUPS,
} from "../../components/Fitness/TargetFilterBar";
import PlansSheet from "../../components/Fitness/PlansSheet";
import WeeklySchedulePopUp from "../../components/Fitness/WeeklySchedulePopUp";

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
  const [plansOpen, setPlansOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const debouncedQuery = useDebounced(query.trim().toLowerCase(), 300);
  const { list, loading, error, refresh } = useExerciseAPI(
    debouncedQuery ? undefined : selectedTarget,
    debouncedQuery || undefined
  );

  const { refreshing, handleRefresh } = useGlobalRefresh({
    tabName: "fitness",
    onInternalRefresh: refresh,
  });

  const [selected, setSelected] = useState<ExerciseListItem | null>(null);
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

      {/* Header actions row */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 24,
          marginTop: 10,
          marginBottom: 4,
          gap: 10,
        }}>
        {/* Calendar (schedule) – green */}
        <TouchableOpacity
          onPress={() => setScheduleOpen(true)}
          activeOpacity={0.9}
          style={{
            flex: 1,
            backgroundColor: "#22c55e",
            borderRadius: 18,
            paddingVertical: 12,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Text style={{ color: "#052e16", fontWeight: "800", marginRight: 8 }}>
            Schedule
          </Text>
          <Ionicons name="calendar" size={18} color="#052e16" />
        </TouchableOpacity>

        {/* Plans – weights icon */}
        <TouchableOpacity
          onPress={() => setPlansOpen(true)}
          activeOpacity={0.9}
          style={{
            width: 56,
            backgroundColor: "#171717",
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#262626",
          }}>
          <Ionicons name="barbell" size={22} color="#e5e7eb" />
        </TouchableOpacity>
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

        <ExerciseGrid
          exercises={data}
          onExercisePress={(ex) => setSelected(ex)}
        />
      </RefreshScroll>

      {/* Exercise details modal */}
      <ExerciseDetailModal
        visible={!!selected}
        exercise={selected}
        onClose={() => setSelected(null)}
      />

      {/* Plans sheet */}
      <PlansSheet visible={plansOpen} onClose={() => setPlansOpen(false)} />

      {/* Weekly schedule modal */}
      <WeeklySchedulePopUp
        visible={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />
    </SafeAreaView>
  );
}
