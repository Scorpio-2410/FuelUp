import { View, Text } from 'react-native';

export default function MealScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50">
      <Text className="text-2xl font-bold text-blue-700">Meal</Text>
      <Text className="mt-2 text-neutral-600">Plan and track your meals here.</Text>
    </View>
  );
}


