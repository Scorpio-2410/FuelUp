// app/(tabs)/user.tsx
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import RNPickerSelect from "react-native-picker-select";
import RefreshScroll from "../../components/RefreshScroll";
import { useGlobalRefresh } from "../../components/useGlobalRefresh";

const K_PROFILE = "fu_profile";

type Profile = {
  username: string;
  fullName: string;
  email: string;
  dob?: string;
  heightCm?: number;
  weightKg?: number;
  notifications: boolean;
  avatarUri?: string;
  ethnicity?: string;
  followUpFrequency?: "daily" | "weekly" | "monthly";
  fitnessGoal?:
    | "lose_weight"
    | "build_muscle"
    | "improve_strength"
    | "increase_endurance"
    | "recomposition"
    | "general_health";
};

const defaultProfile: Profile = {
  username: "",
  fullName: "",
  email: "",
  notifications: true,
  followUpFrequency: "daily",
  fitnessGoal: "general_health",
  ethnicity: "not_specified",
};

const ETHNICITY_ITEMS = [
  { label: "Not specified", value: "not_specified" },
  { label: "African", value: "african" },
  { label: "Arab", value: "arab" },
  { label: "Bangladeshi", value: "bangladeshi" },
  { label: "Chinese", value: "chinese" },
  { label: "European", value: "european" },
  { label: "Filipino", value: "filipino" },
  { label: "Greek", value: "greek" },
  { label: "Indian", value: "indian" },
  { label: "Japanese", value: "japanese" },
  { label: "Korean", value: "korean" },
  { label: "Maori", value: "maori" },
  { label: "Middle Eastern", value: "middle_eastern" },
  { label: "Pakistani", value: "pakistani" },
  { label: "Sri Lankan", value: "sri_lankan" },
  { label: "Thai", value: "thai" },
  { label: "Turkish", value: "turkish" },
  { label: "Vietnamese", value: "vietnamese" },
  { label: "Other", value: "other" },
];

const FREQUENCY_ITEMS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const FITNESS_GOAL_ITEMS = [
  { label: "Lose weight (fat loss)", value: "lose_weight" },
  { label: "Build muscle (hypertrophy)", value: "build_muscle" },
  { label: "Improve strength", value: "improve_strength" },
  { label: "Increase endurance/cardio", value: "increase_endurance" },
  { label: "Recomposition (lose fat & gain muscle)", value: "recomposition" },
  { label: "General health & activity", value: "general_health" },
];

export default function UserTabProfile() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Global refresh hook with custom user profile refresh logic
  const { refreshing, handleRefresh } = useGlobalRefresh({
    tabName: 'user',
    onInternalRefresh: async () => {
      try {
        const raw = await SecureStore.getItemAsync(K_PROFILE);
        if (raw) {
          const parsed = JSON.parse(raw);
          setProfile({ ...defaultProfile, ...parsed });
        }
      } catch (e) {
        console.warn("Profile refresh error:", e);
      }
    }
  });

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(K_PROFILE);
        if (raw) {
          const parsed = JSON.parse(raw);
          setProfile({ ...defaultProfile, ...parsed }); // merge with defaults
        } else {
          setProfile(defaultProfile);
        }
      } catch (e) {
        console.warn("Profile load error:", e);
        setProfile(defaultProfile);
      }
      setLoading(false);
    })();
  }, []);

  async function pickAvatar() {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert(
        "Permission needed",
        "Enable Photos access to choose an avatar."
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets[0]) {
      setProfile((p) => ({ ...p, avatarUri: res.assets[0].uri }));
    }
  }



  async function save() {
    if (!profile.username.trim()) {
      Alert.alert("Username required", "Please enter a username.");
      return;
    }
    setSaving(true);
    await SecureStore.setItemAsync(K_PROFILE, JSON.stringify(profile));
    setSaving(false);
    Alert.alert("Saved", "Your profile has been updated.");
  }

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-black">
      <RefreshScroll refreshing={refreshing} onRefresh={handleRefresh}>
        <View className="flex-1 px-5 pt-8" style={{ paddingBottom: 120 }}>
        <Text className="text-2xl font-semibold text-white mb-4">
          Your Profile
        </Text>

        {/* Avatar + username */}
        <Pressable onPress={pickAvatar} className="items-center mb-4">
          <View className="w-28 h-28 rounded-full bg-neutral-800 overflow-hidden items-center justify-center">
            {profile.avatarUri ? (
              <Image
                source={{ uri: profile.avatarUri }}
                className="w-full h-full"
              />
            ) : (
              <Text className="text-neutral-400">Pick Avatar</Text>
            )}
          </View>
          <Text className="text-neutral-400 mt-2">
            {profile.username ? profile.username : "username"}
          </Text>
        </Pressable>

        {/* Username */}
        <Field label="Username (shown in app)">
          <TextInput
            className="bg-neutral-900 text-white rounded-lg px-3 py-3 border border-neutral-800"
            placeholder="username"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            value={profile.username}
            onChangeText={(v) => setProfile({ ...profile, username: v })}
          />
        </Field>

        {/* Full name */}
        <Field label="Full name">
          <TextInput
            className="bg-neutral-900 text-white rounded-lg px-3 py-3 border border-neutral-800"
            placeholder="Your full name"
            placeholderTextColor="#9CA3AF"
            value={profile.fullName}
            onChangeText={(v) => setProfile({ ...profile, fullName: v })}
          />
        </Field>

        {/* Email */}
        <Field label="Email">
          <TextInput
            className="bg-neutral-900 text-white rounded-lg px-3 py-3 border border-neutral-800"
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
            value={profile.email}
            onChangeText={(v) => setProfile({ ...profile, email: v })}
          />
        </Field>

        {/* DOB */}
        <Field label="Date of birth (YYYY-MM-DD)">
          <TextInput
            className="bg-neutral-900 text-white rounded-lg px-3 py-3 border border-neutral-800"
            placeholder="1999-04-12"
            placeholderTextColor="#9CA3AF"
            value={profile.dob ?? ""}
            onChangeText={(v) => setProfile({ ...profile, dob: v })}
          />
        </Field>

        {/* Height */}
        <Field label="Height (cm)">
          <TextInput
            className="bg-neutral-900 text-white rounded-lg px-3 py-3 border border-neutral-800"
            placeholder="175"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={profile.heightCm?.toString() ?? ""}
            onChangeText={(v) =>
              setProfile({ ...profile, heightCm: v ? Number(v) : undefined })
            }
          />
        </Field>

        {/* Weight */}
        <Field label="Weight (kg)">
          <TextInput
            className="bg-neutral-900 text-white rounded-lg px-3 py-3 border border-neutral-800"
            placeholder="70"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={profile.weightKg?.toString() ?? ""}
            onChangeText={(v) =>
              setProfile({ ...profile, weightKg: v ? Number(v) : undefined })
            }
          />
        </Field>

        {/* Ethnicity */}
        <Field label="Ethnicity">
          <Dropdown
            value={profile.ethnicity ?? "not_specified"}
            items={ETHNICITY_ITEMS}
            placeholderLabel="Select ethnicity"
            onChange={(v) => setProfile({ ...profile, ethnicity: v })}
          />
        </Field>

        {/* Follow-up questions frequency */}
        <Field label="Follow-up questions frequency">
          <Dropdown
            value={profile.followUpFrequency ?? "daily"}
            items={FREQUENCY_ITEMS}
            placeholderLabel="Choose frequency"
            onChange={(v) =>
              setProfile({
                ...profile,
                followUpFrequency: v as Profile["followUpFrequency"],
              })
            }
          />
        </Field>

        {/* Fitness goal */}
        <Field label="Fitness goal">
          <Dropdown
            value={profile.fitnessGoal ?? "general_health"}
            items={FITNESS_GOAL_ITEMS}
            placeholderLabel="Select primary goal"
            onChange={(v) =>
              setProfile({
                ...profile,
                fitnessGoal: v as Profile["fitnessGoal"],
              })
            }
          />
        </Field>

        {/* Notifications */}
        <Row>
          <Text className="text-white font-medium">Notifications</Text>
          <Switch
            value={profile.notifications}
            onValueChange={(v) => setProfile({ ...profile, notifications: v })}
          />
        </Row>
        </View>
      </RefreshScroll>

      {/* Save */}
      <View className="px-5 pb-6">
        <Pressable
          onPress={save}
          disabled={saving}
          className={`rounded-xl p-3 ${
            saving ? "bg-blue-400" : "bg-blue-600"
          }`}>
          <Text className="text-white text-center font-semibold">
            {saving ? "Saving…" : "Save"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <Text className="text-neutral-300 mb-2">{label}</Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-3 mb-4">
      {children}
    </View>
  );
}

/** Compact dropdown wrapper (RNPickerSelect) */
function Dropdown({
  value,
  items,
  onChange,
  placeholderLabel,
}: {
  value: string;
  items: { label: string; value: string }[];
  onChange: (v: string) => void;
  placeholderLabel: string;
}) {
  return (
    <View className="bg-neutral-900 border border-neutral-800 rounded-lg">
      <RNPickerSelect
        onValueChange={(v) => {
          // only update when a real value (not null placeholder)
          if (typeof v === "string") onChange(v);
        }}
        value={value}
        items={items}
        placeholder={{ label: placeholderLabel, value: null }}
        style={{
          inputIOS: {
            paddingVertical: 12,
            paddingHorizontal: 12,
            color: "white",
          },
          inputAndroid: {
            paddingVertical: 8,
            paddingHorizontal: 12,
            color: "white",
          },
          placeholder: { color: "#9CA3AF" },
          iconContainer: { top: 14, right: 12 },
        }}
        useNativeAndroidPickerStyle={false}
        Icon={() => <Text style={{ color: "#9CA3AF" }}>▾</Text>}
      />
    </View>
  );
}
