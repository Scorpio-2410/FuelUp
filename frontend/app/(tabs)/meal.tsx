// frontend/app/(tabs)/meal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import TopSearchBar from "../../components/TopSearchBar";
import RecipeCard from "../../components/Meal/RecipeCard";
import { apiSearchRecipesV3 } from "../../constants/api";

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
type FSRecipeLite = { // this is the type for the recipes from FatSecret
  recipe_id: string;
  recipe_name: string;
  recipe_image?: string | null;
};

/* -------------------- screen -------------------- */
export default function MealScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0); // FatSecret is 0-based
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FSRecipeLite[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [maxResults] = useState(25);

  const q = useDebounce(query.trim(), 400);

  async function fetchPage(p: number, qStr: string) {
    setLoading(true);
    try {
      const data = await apiSearchRecipesV3({ // this is the API call to FatSecret
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

  const HeaderLoader = useMemo(
    () => (
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        {loading ? (
          <View className="items-center justify-center py-6">
            <ActivityIndicator />
          </View>
        ) : null}
      </View>
    ),
    [loading]
  );

  /* -------------------- top pagination bar -------------------- */
  function PaginationBar() {
    return (
      <View
        className="flex-row items-center justify-between"
        style={{ paddingHorizontal: 16, marginBottom: 8 }}>
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
            backgroundColor: canPrev ? "#262626" : "#171717",
          }}>
          <Text
            style={{ color: canPrev ? "#fff" : "#6b7280", fontWeight: "600" }}>
            Prev
          </Text>
        </Pressable>

        <Text style={{ color: "#9ca3af" }}>
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
            backgroundColor: approxHasMore ? "#2563eb" : "#171717",
          }}>
          <Text
            style={{
              color: approxHasMore ? "#fff" : "#6b7280",
              fontWeight: "700",
            }}>
            Next
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: "#1a1a1a", paddingTop: insets.top }}>
      {/* Search */}
      <TopSearchBar
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery("")}
        placeholder="Search"
      />

      {/* Pagination at the TOP */}
      <PaginationBar />

      {/* Results */}
      <FlatList
        data={items}
        keyExtractor={(it) => it.recipe_id}
        ListHeaderComponent={HeaderLoader} // just the spinner when loading
        contentContainerStyle={{ paddingBottom: 8 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <RecipeCard
              title={item.recipe_name}
              imageUrl={item.recipe_image || null}
              onPress={() => router.push(`/meal/${item.recipe_id}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
              <Text className="text-neutral-400 text-center">
                Search for meals and foods.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
