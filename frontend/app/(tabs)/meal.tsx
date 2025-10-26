// frontend/app/(tabs)/meal.tsx
import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import TopSearchBar from "../../components/TopSearchBar";
import MealPreferences from "../../components/Meal/MealPreferences";
import ScrollableMealGrid from "../../components/Meal/ScrollableMealGrid";
import LogMealButton from "../../components/Meal/LogMealButton";
import RecommendMealButton from "../../components/Meal/RecommendMealButton";
import LoggedMealsList, {
  LoggedMealsListRef,
} from "../../components/Meal/LoggedMealsList";
import RefreshScroll from "../../components/RefreshScroll";
import Toast from "../../components/Shared/Toast";
import { useGlobalRefresh } from "../../components/useGlobalRefresh";
import { apiSearchRecipesV3 } from "../../constants/api";
import DynamicBackground from "../../components/Theme/DynamicTheme";
import { useTheme } from "../../contexts/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import MealPlansScreen from "../../components/Meal/mealPlans";

/* -------------------- small debounce hook -------------------- */
function useDebounce<T>(value: T, delay = 400) {
  const [v, setV] = useState(value);
  const t = useRef<any>(null);
  useEffect(() => {
    clearTimeout(t.current as any);
    t.current = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t.current as any);
  }, [value, delay]);
  return v;
}

/* -------------------- types -------------------- */
type FSRecipeLite = {
  // this is the type for the recipes from FatSecret
  recipe_id: string;
  recipe_name: string;
  recipe_image?: string | null;
};

/* -------------------- screen -------------------- */
export default function MealScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();

  const [query, setQuery] = useState("");
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [page, setPage] = useState(0); // FatSecret is 0-based
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FSRecipeLite[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [maxResults] = useState(25);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "success"
  );

  const loggedMealsRef = useRef<LoggedMealsListRef>(null);

  const q = useDebounce(query.trim(), 400);

  async function fetchPage(p: number, qStr: string) {
    setLoading(true);
    try {
      const data = await apiSearchRecipesV3({
        // this is the API call to FatSecret
        q: qStr,
        page: p,
        maxResults,
      });

      const list = data?.recipes?.recipe ?? [];
      const normalized: any[] = Array.isArray(list) ? list : list ? [list] : [];

      const mapped: FSRecipeLite[] = normalized.map((r: any) => ({
        recipe_id: String(r.recipe_id),
        recipe_name: String(r.recipe_name || ""),
        recipe_image: r.recipe_image || r?.recipe_images?._500 || null,
      }));

      setItems(mapped);

      const totalResults = Number(data?.recipes?.total_results ?? NaN);
      setTotal(Number.isFinite(totalResults) ? totalResults : null);
    } catch {
      setItems([]);
      setTotal(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPage(0, q);
    setPage(0);
  }, [q]);

  const canPrev = page > 0;
  const approxHasMore = total == null ? true : (page + 1) * maxResults < total;

  const { refreshing, handleRefresh } = useGlobalRefresh({
    tabName: "meal",
    onInternalRefresh: () => {
      // Refetch current page
      fetchPage(page, q);
    },
  });

  /* -------------------- top pagination bar -------------------- */
  function PaginationBar() {
    return (
      <View
        className="flex-row items-center justify-between"
        style={{ paddingHorizontal: 20, marginBottom: 12 }}
      >
        <Pressable
          onPress={() => {
            if (canPrev) {
              const next = page - 1;
              setPage(next);
              fetchPage(next, q);
            }
          }}
          disabled={!canPrev}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: canPrev ? "#374151" : "#1f2937",
            borderWidth: 1,
            borderColor: canPrev ? "#4b5563" : "#374151",
          }}
        >
          <Text
            style={{ color: canPrev ? "#fff" : "#6b7280", fontWeight: "600" }}
          >
            Prev
          </Text>
        </Pressable>

        <Text style={{ color: "#d1d5db", fontWeight: "500" }}>
          Page {page + 1}
          {total != null
            ? ` • ${Math.min((page + 1) * maxResults, total)}/${total}`
            : ""}
        </Text>

        <Pressable
          onPress={() => {
            if (approxHasMore) {
              const next = page + 1;
              setPage(next);
              fetchPage(next, q);
            }
          }}
          disabled={!approxHasMore}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: approxHasMore ? "#2563eb" : "#1f2937",
            borderWidth: 1,
            borderColor: approxHasMore ? "#3b82f6" : "#374151",
          }}
        >
          <Text
            style={{
              color: approxHasMore ? "#fff" : "#6b7280",
              fontWeight: "700",
            }}
          >
            Next
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <DynamicBackground theme={theme}>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/* Toast Notification */}
        <Toast
          visible={showToast}
          message={toastMessage}
          type={toastType}
          onHide={() => setShowToast(false)}
        />

        <RefreshScroll refreshing={refreshing} onRefresh={handleRefresh}>
          {/* Search */}
          <TopSearchBar
            value={query}
            onChangeText={setQuery}
            onClear={() => setQuery("")}
            onAvatarPress={() => setPrefsOpen(true)}
          />

          {/* Header */}
          <View
            style={{ paddingHorizontal: 24, marginTop: 10, marginBottom: 4 }}
          >
            <Text style={{ color: "#fff", fontSize: 40, fontWeight: "800" }}>
              Nutrition
            </Text>
          </View>
          <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
            <Pressable
              onPress={() => router.push("/meal-plans")}
              style={{
                backgroundColor: "#2563eb",
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "700",
                  letterSpacing: 0.3,
                }}
              >
                View Meal Plans
              </Text>
            </Pressable>
          </View>

          {/* Card Container for Pagination and Grid */}
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              backgroundColor: "rgba(26, 26, 26, 0.24)",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.1)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              overflow: "hidden",
            }}
          >
            {/* Pagination at the TOP */}
            <View style={{ paddingTop: 12 }}>
              <PaginationBar />
            </View>

            {/* Subtle Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                marginHorizontal: 16,
                marginBottom: 8,
              }}
            />

            {/* Meal Items Section - Scrollable Grid with Fade Effect */}
            <ScrollableMealGrid
              items={items}
              loading={loading}
              onRecipePress={(recipeId) => router.push(`/meal/${recipeId}`)}
              height={450}
            />
          </View>

          {/* Log Meal Button */}
          <LogMealButton
            onSuccess={() => {
              setToastType("success");
              setToastMessage("Meal logged successfully!");
              setShowToast(true);
              // Refresh the logged meals list
              loggedMealsRef.current?.refresh();
            }}
            onError={(error) => {
              setToastType("error");
              setToastMessage(error);
              setShowToast(true);
            }}
          />

          {/* Recommend Meal Button (opens modal with AI recommendations) */}
          <RecommendMealButton
            onOpen={() => {
              setToastType("info");
              setToastMessage("Generating recommendations...");
              setShowToast(true);
            }}
            onClose={() => {
              // clear the info toast when modal closes
              setShowToast(false);
            }}
          />

          {/* Logged Meals List */}
          <LoggedMealsList ref={loggedMealsRef} />

          {/* Additional content can be added here later */}
          <View style={{ height: 100 }} />
          <MealPreferences
            visible={prefsOpen}
            onClose={() => setPrefsOpen(false)}
          />
        </RefreshScroll>
      </View>
    </DynamicBackground>
  );
}
