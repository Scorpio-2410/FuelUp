import { View, Text, TouchableOpacity, ScrollView } from "react-native";

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ paddingHorizontal: 24, marginTop: 12 }}
    >
      <View style={{ flexDirection: "row", gap: 8 }}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => onCategoryChange(c)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: activeCategory === c ? "#4ade80" : "#2a2a2a",
            }}
          >
            <Text
              style={{
                color: activeCategory === c ? "#0a0a0a" : "#e5e5e5",
                fontWeight: "600",
              }}
            >
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
