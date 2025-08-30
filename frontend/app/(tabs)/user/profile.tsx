import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Switch } from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

const K_PROFILE = "fu_profile";

type Profile = {
  name: string;
  email: string;
  units: "metric" | "imperial";
  theme: "system" | "dark" | "light";
  notifications: boolean;
};

const defaultProfile: Profile = {
  name: "",
  email: "",
  units: "metric",
  theme: "system",
  notifications: true,
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loading, setLoading] = useState(true);

  // Load saved profile (no auth for MVP)
  useEffect(() => {
    (async () => {
      const p = await SecureStore.getItemAsync(K_PROFILE);
      if (p) setProfile(JSON.parse(p));
      setLoading(false);
    })();
  }, []);

  async function save() {
    await SecureStore.setItemAsync(K_PROFILE, JSON.stringify(profile));
    router.back();
  }

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Loading…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black px-5 pt-8 gap-5">
      <Text className="text-2xl font-semibold text-white mb-2">Profile</Text>

      {/* Name */}
      <Field label="Name">
        <TextInput
          className="bg-neutral-900 text-white rounded-lg px-3 py-3 border border-neutral-800"
          placeholder="Your name"
          placeholderTextColor="#9CA3AF"
          value={profile.name}
          onChangeText={(v) => setProfile({ ...profile, name: v })}
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

      {/* Units */}
      <Row>
        <Text className="text-white font-medium">Units</Text>
        <Segmented
          value={profile.units}
          options={[
            ["metric", "Metric"],
            ["imperial", "Imperial"],
          ]}
          onChange={(v) => setProfile({ ...profile, units: v as Profile["units"] })}
        />
      </Row>

      {/* Theme */}
      <Row>
        <Text className="text-white font-medium">Theme</Text>
        <Segmented
          value={profile.theme}
          options={[
            ["system", "System"],
            ["dark", "Dark"],
            ["light", "Light"],
          ]}
          onChange={(v) => setProfile({ ...profile, theme: v as Profile["theme"] })}
        />
      </Row>

      {/* Notifications */}
      <Row>
        <Text className="text-white font-medium">Notifications</Text>
        <Switch
          value={profile.notifications}
          onValueChange={(v) => setProfile({ ...profile, notifications: v })}
        />
      </Row>

      {/* Save */}
      <Pressable onPress={save} className="bg-blue-600 rounded-xl p-3 mt-5">
        <Text className="text-white text-center font-semibold">Save</Text>
      </Pressable>
    </View>
  );
}

/* --- UI helpers --- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="text-neutral-300 mb-2">{label}</Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-3">
      {children}
    </View>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <View className="flex-row bg-neutral-800 rounded-full p-1">
      {options.map(([val, label]) => {
        const active = value === val;
        return (
          <Pressable
            key={val}
            onPress={() => onChange(val)}
            className={`px-3 py-1.5 rounded-full ${active ? "bg-neutral-100" : "bg-transparent"}`}
          >
            <Text className={`${active ? "text-black" : "text-neutral-300"} text-sm`}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
