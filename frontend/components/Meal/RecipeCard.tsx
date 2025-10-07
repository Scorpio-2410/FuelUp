// frontend/components/Meal/RecipeCard.tsx
import { View, Text, Pressable, Image } from "react-native";

type Props = {
  title: string;
  imageUrl?: string | null;
  onPress?: () => void;
};

export default function RecipeCard({ title, imageUrl, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-neutral-900 rounded-2xl p-3 mb-3 border border-neutral-800"
      style={{ overflow: "hidden" }}>
      <View className="flex-row">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: 80, height: 80, borderRadius: 12, marginRight: 12 }}
          />
        ) : (
          <View
            style={{ width: 80, height: 80, borderRadius: 12, marginRight: 12 }}
            className="bg-neutral-800"
          />
        )}
        <View className="flex-1 justify-center">
          <Text className="text-white font-semibold" numberOfLines={2}>
            {title}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
