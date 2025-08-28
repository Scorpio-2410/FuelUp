import { View, Text } from 'react-native';

export default function UserScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50">
      <Text className="text-2xl font-bold text-indigo-700">User</Text>
      <Text className="mt-2 text-neutral-600">Manage profile and settings here.</Text>
    </View>
  );
}


