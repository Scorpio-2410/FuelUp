import { View, Text, SafeAreaView, ScrollView, Switch } from "react-native";
import RefreshScroll from "../../components/RefreshScroll";
import { Ionicons } from "@expo/vector-icons";
import { useGlobalRefresh } from "../../components/useGlobalRefresh";
import WeeklySchedulePopUp from "../../components/Fitness/WeeklySchedulePopUp";
import WorkoutRecommendationHero from "../../components/Fitness/WorkoutRecommendationHero";
import UserStats from "../../components/Fitness/UserStats";
import CategoryFilter from "../../components/Fitness/CategoryFilter";
import ExerciseGrid from "../../components/Fitness/ExerciseGrid";
import ExercisePagination from "../../components/Fitness/ExercisePagination";
import CalendarShortcut from "../../components/Fitness/CalendarShortcut";
import WorkoutDetailPopup from "../../components/Fitness/WorkoutDetailPopup";
import { useExerciseData } from "../../components/Fitness/ExerciseData";
import { useMemo, useState } from "react";
import TopSearchBar from "../../components/TopSearchBar";

export default function FitnessScreen() {
  // Global refresh hook (no custom logic needed for fitness tab)
  const { refreshing, handleRefresh } = useGlobalRefresh({
    tabName: "fitness",
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [workoutDetailVisible, setWorkoutDetailVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [canGoGym, setCanGoGym] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(0);

  const EXERCISES_PER_PAGE = 6;

  // Get exercise data from temporary component (placeholder for API)
  const { gymCategories, homeCategories, exercisesGym, exercisesHome } =
    useExerciseData();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = canGoGym ? exercisesGym : exercisesHome;
    return list.filter((e) => {
      const byCat = activeCategory === "All" || e.category === activeCategory;
      const byQuery = !q || e.name.toLowerCase().includes(q);
      return byCat && byQuery;
    });
  }, [query, activeCategory, canGoGym, exercisesGym, exercisesHome]);

  // Reset to first page when filters change
  const resetToFirstPage = () => {
    setCurrentPage(0);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filtered.length / EXERCISES_PER_PAGE);
  const startIndex = currentPage * EXERCISES_PER_PAGE;
  const endIndex = startIndex + EXERCISES_PER_PAGE;
  const currentExercises = filtered.slice(startIndex, endIndex);

  // Reset page when filters change
  useMemo(() => {
    resetToFirstPage();
  }, [query, activeCategory, canGoGym]);

  // Handle exercise selection
  const handleExercisePress = (exercise: any) => {
    setSelectedExercise(exercise);
    setWorkoutDetailVisible(true);
  };

  return (
    // <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top search bar */}
        <TopSearchBar
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery("")}
        />

        <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
          <Text
            style={{
              color: "#ffffff",
              fontSize: 22,
              fontWeight: "700",
              marginBottom: 6,
            }}
          >
            Exercises
          </Text>
          <Text style={{ color: "#a1a1aa", fontSize: 16, fontWeight: "400" }}>
            {canGoGym
              ? "Here's some curated workouts for you."
              : "Since you can't go to the gym, here are some alternatives."}
          </Text>
        </View>

        {/* Gym/Home toggle */}
        <View
          style={{
            paddingHorizontal: 24,
            marginTop: 8,
            marginBottom: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
            Can go gym?
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: canGoGym ? "#4ade80" : "#a1a1aa" }}>
              {canGoGym ? "Yes" : "No"}
            </Text>
            <Switch
              value={canGoGym}
              onValueChange={(v) => {
                setCanGoGym(v);
                setActiveCategory("All");
                setCurrentPage(0);
              }}
            />
          </View>
        </View>

        {/* Hero Section - Workout Recommendation */}
        <WorkoutRecommendationHero canGoGym={canGoGym} />

        {/* User stats */}
        <UserStats />

        {/* Calendar shortcut */}
        <CalendarShortcut onPress={() => setModalVisible(true)} />

        {/* Categories */}
        <CategoryFilter
          categories={canGoGym ? gymCategories : homeCategories}
          activeCategory={activeCategory}
          onCategoryChange={(c) => {
            setActiveCategory(c);
            setCurrentPage(0);
          }}
        />

        {/* Exercise grid */}
        <ExerciseGrid
          exercises={currentExercises}
          onExercisePress={handleExercisePress}
        />

        {/* Pagination */}
        <View style={{ paddingHorizontal: 24 }}>
          <ExercisePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalExercises={filtered.length}
            exercisesPerPage={EXERCISES_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </View>
      </ScrollView>

      {/* Weekly schedule modal */}
      <WeeklySchedulePopUp
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      {/* Workout detail popup */}
      <WorkoutDetailPopup
        visible={workoutDetailVisible}
        exercise={selectedExercise}
        onClose={() => {
          setWorkoutDetailVisible(false);
          setSelectedExercise(null);
        }}
      />
    </SafeAreaView>
  );
}
