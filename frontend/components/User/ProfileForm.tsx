import React, { useEffect, useState } from "react";
import { View, Text, Switch } from "react-native";

import ProfileAvatar from "./ProfileAvatar";
import ProfileField from "./ProfileField";
import ProfileDropdown from "./ProfileDropdown";
import ProfileRow from "./ProfileRow";

import {
  ETHNICITY_ITEMS,
  FREQUENCY_ITEMS,
  GENDER_ITEMS,
} from "./profileConstants";

/** USER-ONLY type */
type Profile = {
  username: string;
  fullName: string;
  email: string;
  dob?: string;
  notifications: boolean;
  avatarUri?: string;
  ethnicity?: string;
  followUpFrequency?: "daily" | "weekly" | "monthly";
  gender?: string;
  /** display-only unit prefs for DOB inputs etc. kept here if needed later */
  heightUnit?: "cm" | "ft";
  weightUnit?: "kg" | "lb";
};

// ----- date helpers (no JS Date objects) -----
const pad2 = (n: number) => String(n).padStart(2, "0");
const plain = (val?: string) => (val ? String(val).slice(0, 10) : undefined);
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const mdays = (y: number, m: number) =>
  [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
const isValidYMD = (y?: number, m?: number, d?: number) =>
  !!y && !!m && !!d && m >= 1 && m <= 12 && d >= 1 && d <= mdays(y, m);
const parseISO = (iso?: string) => {
  const s = plain(iso);
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!isValidYMD(y, m, d)) return undefined;
  return { y, m, d };
};
const toISO = (y: number, m: number, d: number) => `${y}-${pad2(m)}-${pad2(d)}`;

// DOB picker items
const dayItems = Array.from({ length: 31 }, (_, i) => {
  const d = pad2(i + 1);
  return { label: d, value: d };
});
const monthItems = Array.from({ length: 12 }, (_, i) => {
  const mm = pad2(i + 1);
  return { label: mm, value: mm };
});
const yearItems = (() => {
  const now = new Date().getFullYear();
  const start = now - 100;
  return Array.from({ length: now - start + 1 }, (_, i) => {
    const y = String(now - i);
    return { label: y, value: y };
  });
})();

type Props = {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
};

export default function ProfileForm({ profile, setProfile }: Props) {
  // DOB local draft
  const initial = parseISO(profile.dob);
  const [dobDay, setDobDay] = useState<string>(initial ? pad2(initial.d) : "");
  const [dobMonth, setDobMonth] = useState<string>(
    initial ? pad2(initial.m) : ""
  );
  const [dobYear, setDobYear] = useState<string>(
    initial ? String(initial.y) : ""
  );

  useEffect(() => {
    const p = parseISO(profile.dob);
    if (p) {
      setDobDay(pad2(p.d));
      setDobMonth(pad2(p.m));
      setDobYear(String(p.y));
    }
  }, [profile.dob]);

  const handleDobChange = (part: "d" | "m" | "y", v: string) => {
    let D = dobDay,
      M = dobMonth,
      Y = dobYear;
    if (part === "d") D = v;
    if (part === "m") M = v;
    if (part === "y") Y = v;

    setDobDay(D);
    setDobMonth(M);
    setDobYear(Y);

    const y = Number(Y),
      m = Number(M),
      d = Number(D);
    if (isValidYMD(y, m, d)) setProfile({ ...profile, dob: toISO(y, m, d) });
    else setProfile({ ...profile, dob: undefined });
  };

  return (
    <>
      <ProfileAvatar profile={profile as any} setProfile={setProfile as any} />

      {/* Basic Info Section */}
      <View className="mb-6">
        <Text className="text-white text-lg font-bold mb-4 flex-row items-center">
          <Text className="text-2xl mr-2">👤</Text> Basic Info
        </Text>
        
        <ProfileField
          label="USERNAME"
          textInputProps={{
            placeholder: "username",
            autoCapitalize: "none",
            value: profile.username,
            onChangeText: (v) => setProfile({ ...profile, username: v }),
          }}
        />

        <ProfileField
          label="FULL NAME"
          textInputProps={{
            placeholder: "Your full name",
            value: profile.fullName,
            onChangeText: (v) => setProfile({ ...profile, fullName: v }),
          }}
        />

        {/* Email (view-only) */}
        <View className="opacity-60">
          <ProfileField
            label="EMAIL (READ-ONLY)"
            textInputProps={{
              value: profile.email,
              editable: false,
              selectTextOnFocus: false,
              placeholder: "you@example.com",
            }}
          />
        </View>
      </View>

      {/* Personal Details Section */}
      <View className="mb-6">
        <Text className="text-white text-lg font-bold mb-4">
          <Text className="text-2xl mr-2">🎂</Text> Personal Details
        </Text>
        
        {/* DOB */}
        <ProfileField label="DATE OF BIRTH">
          <View className="flex-row gap-3">
            <View style={{ flex: 1 }}>
              <ProfileDropdown
                value={dobDay}
                items={dayItems}
                placeholderLabel="DD"
                onChange={(v) => handleDobChange("d", v)}
              />
            </View>
            <View style={{ flex: 1.2 }}>
              <ProfileDropdown
                value={dobMonth}
                items={monthItems}
                placeholderLabel="MM"
                onChange={(v) => handleDobChange("m", v)}
              />
            </View>
            <View style={{ flex: 1.2 }}>
              <ProfileDropdown
                value={dobYear}
                items={yearItems}
                placeholderLabel="YYYY"
                onChange={(v) => handleDobChange("y", v)}
              />
            </View>
          </View>
        </ProfileField>

        {/* Gender */}
        <ProfileField label="GENDER">
          <ProfileDropdown
            value={profile.gender ?? "prefer_not_to_say"}
            items={GENDER_ITEMS}
            placeholderLabel="Select gender"
            onChange={(v) => setProfile({ ...profile, gender: v })}
          />
        </ProfileField>

        {/* Ethnicity */}
        <ProfileField label="ETHNICITY">
          <ProfileDropdown
            value={profile.ethnicity ?? "not_specified"}
            items={ETHNICITY_ITEMS}
            placeholderLabel="Select ethnicity"
            onChange={(v) => setProfile({ ...profile, ethnicity: v })}
          />
        </ProfileField>
      </View>

      {/* Preferences Section */}
      <View className="mb-6">
        <Text className="text-white text-lg font-bold mb-4">
          <Text className="text-2xl mr-2">⚙️</Text> Preferences
        </Text>

        {/* Follow-up frequency */}
        <ProfileField label="FOLLOW-UP FREQUENCY">
          <ProfileDropdown
            value={profile.followUpFrequency ?? "daily"}
            items={FREQUENCY_ITEMS}
            placeholderLabel="Choose frequency"
            onChange={(v) =>
              setProfile({ ...profile, followUpFrequency: v as any })
            }
          />
        </ProfileField>

        {/* Notifications */}
        <View className="flex-row items-center justify-between bg-gray-900/50 border border-gray-800/50 rounded-xl px-4 py-4 mb-5">
          <View className="flex-row items-center gap-3">
            <Text className="text-2xl">🔔</Text>
            <Text className="text-white font-semibold text-base">Notifications</Text>
          </View>
          <Switch
            value={profile.notifications}
            onValueChange={(v) => setProfile({ ...profile, notifications: v })}
            trackColor={{ false: "#374151", true: "#8B5CF6" }}
            thumbColor={profile.notifications ? "#ffffff" : "#9CA3AF"}
          />
        </View>
      </View>
    </>
  );
}
