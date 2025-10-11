// frontend/components/TopSearchBar.tsx
import React from "react";
import { View, TextInput, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  onClear?: () => void;
  avatarUri?: string; // optional – show profile avatar if provided
  placeholder?: string; // optional – defaults to "Search"
};

export default function TopSearchBar({
  value,
  onChangeText,
  onClear,
  avatarUri,
  placeholder = "Search",
}: Props) {
  return (
    <View
      style={{
        backgroundColor: "transparent",
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {/* Avatar */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            overflow: "hidden",
            backgroundColor: "#2a2a2a",
          }}
        >
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="person" size={20} color="#a1a1aa" />
            </View>
          )}
        </View>

        {/* Search input */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#2a2a2a",
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Ionicons name="search" size={18} color="#a1a1aa" />
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            style={{ color: "#ffffff", marginLeft: 8, flex: 1 }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {value?.length ? (
            <TouchableOpacity
              onPress={onClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close" size={18} color="#a1a1aa" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}
