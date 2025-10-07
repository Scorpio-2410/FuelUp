// frontend/app/(tabs)/meal/[id].tsx
import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiGetRecipeDetail } from "../../../constants/api";

type FSDir = { direction_description?: string; direction_number?: string };
type FSIng = {
  ingredient_description?: string;
  number_of_units?: string;
  measurement_description?: string;
  food_name?: string;
};
type FSServing = {
  serving_size?: string;
  calories?: string;
  protein?: string;
  carbohydrate?: string;
  fat?: string;
  fiber?: string;
  sugar?: string;
  sodium?: string;
  cholesterol?: string;
  saturated_fat?: string;
  monounsaturated_fat?: string;
  polyunsaturated_fat?: string;
  potassium?: string;
  iron?: string;
  calcium?: string;
  vitamin_a?: string;
  vitamin_c?: string;
  trans_fat?: string;
};

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (!v && v !== ("" as any)) return [];
  return Array.isArray(v) ? v : [v as T];
}

export default function RecipeDetail() {
  // we also receive page & q from the list for restoring state on back
  const { id, page, q } = useLocalSearchParams<{
    id: string;
    page?: string;
    q?: string;
  }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await apiGetRecipeDetail(id!);
        setRecipe(data?.recipe || null);
      } catch {
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  /* -------------------- derived fields -------------------- */
  const title = recipe?.recipe_name || (loading ? "Loading..." : "Recipe");
  const description = recipe?.recipe_description || "";

  const servings = recipe?.number_of_servings || null;
  const gramsPerPortion = recipe?.grams_per_portion || null;
  const rating = recipe?.rating || null;

  const categories: string[] = useMemo(() => {
    const arr = asArray<any>(recipe?.recipe_categories?.recipe_category);
    return arr
      .map((c) => c?.recipe_category_name)
      .filter(Boolean)
      .map(String);
  }, [recipe]);

  const types: string[] = useMemo(
    () => asArray<string>(recipe?.recipe_types?.recipe_type).map(String),
    [recipe]
  );

  // Prefer serving_sizes.serving (richer), else recipe_nutrition
  const serving: FSServing | null = useMemo(() => {
    const s = recipe?.serving_sizes?.serving;
    return s && typeof s === "object" ? (s as FSServing) : null;
  }, [recipe]);

  const simpleNut = recipe?.recipe_nutrition || null;

  const ingredients: string[] = useMemo(() => {
    const rich = asArray<FSIng>(recipe?.ingredients?.ingredient).map((it) =>
      it?.ingredient_description
        ? String(it.ingredient_description)
        : `${it.number_of_units || ""} ${it.measurement_description || ""} ${
            it.food_name || ""
          }`.trim()
    );
    const simple = asArray<string>(
      recipe?.recipe_ingredients?.ingredient as any
    ).map(String);
    return Array.from(
      new Set([...rich.filter(Boolean), ...simple.filter(Boolean)])
    );
  }, [recipe]);

  const directions: string[] = useMemo(() => {
    const list = asArray<FSDir>(recipe?.directions?.direction);
    return list
      .map((d) => d?.direction_description)
      .filter(Boolean)
      .map(String);
  }, [recipe]);

  const recipeUrl: string | null = recipe?.recipe_url || null;

  /* -------------------- UI helpers -------------------- */
  function Row({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) {
    if (value === undefined || value === null || value === "") return null;
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 6,
        }}>
        <Text style={{ color: "#9ca3af" }}>{label}</Text>
        <Text style={{ color: "#fff", fontWeight: "600" }}>{value}</Text>
      </View>
    );
  }

  function Pill({ text }: { text: string }) {
    return (
      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: "#1f2937",
          borderWidth: 1,
          borderColor: "#374151",
          marginRight: 8,
          marginBottom: 8,
        }}>
        <Text style={{ color: "#e5e7eb", fontSize: 12 }}>{text}</Text>
      </View>
    );
  }

  /* -------------------- Render -------------------- */
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: "#0f0f0f" }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* Compact back button, clear of the notch */}
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16 }}>
          <Pressable
            onPress={() => {
              const p = page ? String(page) : "0";
              const query = q ? String(q) : "";
              router.replace({
                pathname: "/meal",
                params: { page: p, q: query },
              });
            }}
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: "#18181b",
              borderWidth: 1,
              borderColor: "#27272a",
            }}>
            <Text style={{ color: "#e5e7eb", fontWeight: "700" }}>◀ Back</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {/* Title row with "Open in browser" on the right */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 4,
            }}>
            <Text
              style={{
                color: "#fff",
                fontSize: 28,
                fontWeight: "800",
                flexShrink: 1,
              }}>
              {title}
            </Text>

            {recipeUrl ? (
              <Pressable
                onPress={() => Linking.openURL(recipeUrl)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: "#0b4da2",
                }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Open in browser
                </Text>
              </Pressable>
            ) : null}
          </View>

          {!!description && (
            <Text style={{ color: "#9ca3af", marginTop: 6 }}>
              {description}
            </Text>
          )}

          {/* Meta: servings / grams per portion / rating */}
          <View
            style={{
              marginTop: 14,
              backgroundColor: "#171717",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#262626",
              padding: 12,
            }}>
            <Row label="Servings" value={servings} />
            <Row label="Grams per portion" value={gramsPerPortion} />
            <Row label="Rating" value={rating} />
          </View>

          {/* Categories & Types */}
          {categories.length || types.length ? (
            <View style={{ marginTop: 14 }}>
              {categories.length ? (
                <>
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "800",
                      marginBottom: 8,
                    }}>
                    Categories
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {categories.map((c) => (
                      <Pill key={`c-${c}`} text={c} />
                    ))}
                  </View>
                </>
              ) : null}
              {types.length ? (
                <>
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "800",
                      marginTop: 12,
                      marginBottom: 8,
                    }}>
                    Types
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {types.map((t) => (
                      <Pill key={`t-${t}`} text={t} />
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          ) : null}

          {/* Nutrition */}
          <View
            style={{
              marginTop: 16,
              backgroundColor: "#171717",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#262626",
              padding: 12,
            }}>
            <Text style={{ color: "#fff", fontWeight: "800", marginBottom: 8 }}>
              Nutrition (per serving)
            </Text>

            {serving ? (
              <>
                <Row label="Serving size" value={serving.serving_size} />
                <Row label="Calories" value={serving.calories} />
                <Row label="Protein (g)" value={serving.protein} />
                <Row label="Carbs (g)" value={serving.carbohydrate} />
                <Row label="Fat (g)" value={serving.fat} />
                <Row label="Fiber (g)" value={serving.fiber} />
                <Row label="Sugar (g)" value={serving.sugar} />
                <Row label="Sodium (mg)" value={serving.sodium} />
                <Row label="Cholesterol (mg)" value={serving.cholesterol} />
                <Row label="Sat. fat (g)" value={serving.saturated_fat} />
                <Row label="Mono fat (g)" value={serving.monounsaturated_fat} />
                <Row label="Poly fat (g)" value={serving.polyunsaturated_fat} />
                <Row label="Potassium (mg)" value={serving.potassium} />
                <Row label="Calcium (%)" value={serving.calcium} />
                <Row label="Iron (%)" value={serving.iron} />
                <Row label="Vitamin A (%)" value={serving.vitamin_a} />
                <Row label="Vitamin C (%)" value={serving.vitamin_c} />
                <Row label="Trans fat (g)" value={serving.trans_fat} />
              </>
            ) : (
              <>
                <Row label="Calories" value={simpleNut?.calories} />
                <Row label="Protein (g)" value={simpleNut?.protein} />
                <Row label="Carbs (g)" value={simpleNut?.carbohydrate} />
                <Row label="Fat (g)" value={simpleNut?.fat} />
              </>
            )}
          </View>

          {/* Ingredients */}
          <View
            style={{
              marginTop: 16,
              backgroundColor: "#171717",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#262626",
              padding: 12,
            }}>
            <Text style={{ color: "#fff", fontWeight: "800", marginBottom: 8 }}>
              Ingredients
            </Text>
            {ingredients.length === 0 ? (
              <Text style={{ color: "#9ca3af" }}>
                {loading ? "Loading..." : "Not available."}
              </Text>
            ) : (
              <View style={{ gap: 6 }}>
                {ingredients.map((line, idx) => (
                  <Text key={`${idx}-${line}`} style={{ color: "#e5e7eb" }}>
                    • {line}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Directions */}
          <View
            style={{
              marginTop: 16,
              backgroundColor: "#171717",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#262626",
              padding: 12,
            }}>
            <Text style={{ color: "#fff", fontWeight: "800", marginBottom: 8 }}>
              How to make it
            </Text>
            {directions.length === 0 ? (
              <Text style={{ color: "#9ca3af" }}>
                {loading ? "Loading..." : "Not available."}
              </Text>
            ) : (
              <View style={{ gap: 10 }}>
                {directions.map((s, idx) => (
                  <View
                    key={`${idx}-${s.slice(0, 10)}`}
                    style={{ flexDirection: "row" }}>
                    <Text style={{ color: "#9ca3af", marginRight: 8 }}>
                      {idx + 1}.
                    </Text>
                    <Text style={{ color: "#e5e7eb", flex: 1 }}>{s}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View
            style={{
              height: Platform.select({ ios: 24, android: 16, default: 16 }),
            }}
          />
        </View>
      </ScrollView>
    </>
  );
}
