// frontend/components/Meal/RecipeCard.tsx
import { View, Text, TouchableOpacity, Image } from "react-native";

type Props = {
  title: string;
  imageUrl?: string | null;
  onPress?: () => void;
};

export default function RecipeCard({ title, imageUrl, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: "#2a2a2a",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: "100%",
            height: 120,
            backgroundColor: "#1f1f1f",
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: "100%",
            height: 120,
            backgroundColor: "#1f1f1f",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 40, opacity: 0.3 }}>🍽️</Text>
        </View>
      )}
      <View style={{ padding: 10 }}>
        <Text
          style={{ color: "#ffffff", fontWeight: "700", fontSize: 14 }}
          numberOfLines={2}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
