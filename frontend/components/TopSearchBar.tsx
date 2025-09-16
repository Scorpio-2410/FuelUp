import React from "react";
import { View, TextInput, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  onClear?: () => void;
  avatarUri?: string;
};

export default function TopSearchBar({
  value,
  onChangeText,
  onClear,
  avatarUri,
}: Props) {
  return (
    <View
      style={{
        backgroundColor: "#121212",
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
            placeholder="Search"
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            style={{ color: "#ffffff", marginLeft: 8, flex: 1 }}
          />
          {value.length > 0 ? (
            <TouchableOpacity onPress={onClear}>
              <Ionicons name="close" size={18} color="#a1a1aa" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}
