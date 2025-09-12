import React, { useMemo, useState, useEffect } from "react";
import { View, Text, Switch, TextInput } from "react-native";

import ProfileAvatar from "./ProfileAvatar";
import ProfileField from "./ProfileField";
import ProfileDropdown from "./ProfileDropdown";
import ProfileRow from "./ProfileRow";

import {
  ETHNICITY_ITEMS,
  FREQUENCY_ITEMS,
  FITNESS_GOAL_ITEMS,
  HEIGHT_UNITS,
  WEIGHT_UNITS,
  GENDER_ITEMS,
  ACTIVITY_LEVEL_ITEMS,
} from "./profileConstants";

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
  heightUnit?: "cm" | "ft";
  weightUnit?: "kg" | "lb";
  gender?: string;
  activityLevel?: string;
  dailyCalorieGoal?: number;
};

// ---------- Helpers ----------
// tolerant DOB parser: accepts "YYYY-MM-DD" or full ISO timestamp
const pad2 = (n: number) => String(n).padStart(2, "0");

const parseISO = (iso?: string) => {
  if (!iso) return undefined;
  // normalize to first 10 chars if a timestamp came through
  const s = iso.length > 10 ? iso.slice(0, 10) : iso; // "YYYY-MM-DD"
  const [y, m, d] = s.split("-").map((x) => Number(x));
  if (!y || !m || !d) return undefined;
  return { y, m, d };
};

const toISO = (y: number, m: number, d: number) => `${y}-${pad2(m)}-${pad2(d)}`;
const isValidYMD = (y?: number, m?: number, d?: number) => {
  if (!y || !m || !d) return false;
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  );
};

// conversions (canonical = cm/kg)
const cmPerFt = 30.48;
const cmToFt = (cm: number) => cm / cmPerFt;
const ftToCm = (ft: number) => ft * cmPerFt;
const kgToLb = (kg: number) => kg * 2.2046226218;
const lbToKg = (lb: number) => lb / 2.2046226218;

// numeric items
const numericItems = (
  start: number,
  end: number,
  step = 1,
  toLabel?: (v: number) => string
) =>
  Array.from({ length: Math.floor((end - start) / step) + 1 }, (_, i) => {
    const v = +(start + i * step).toFixed(10);
    const label = toLabel ? toLabel(v) : String(v);
    return { label, value: String(v) };
  });

// ✅ DOB items — PADDED DAY values to keep selection
const dayItems = Array.from({ length: 31 }, (_, i) => {
  const d = pad2(i + 1);
  return { label: d, value: d }; // "01".."31"
});
const monthItems = Array.from({ length: 12 }, (_, i) => {
  const mm = i + 1;
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return { label: `${pad2(mm)} (${names[i]})`, value: pad2(mm) };
});
const yearItems = (() => {
  const now = new Date().getFullYear();
  const start = now - 100;
  return numericItems(start, now, 1).reverse();
})();

type Props = {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
};

export default function ProfileForm({ profile, setProfile }: Props) {
  // ----- DOB local draft (so values don’t blank) -----
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

  // Height/Weight choices
  const heightItems = useMemo(() => {
    return (profile.heightUnit ?? "cm") === "cm"
      ? numericItems(120, 220, 1)
      : numericItems(4.0, 7.5, 0.1, (v) => v.toFixed(1)); // decimal feet
  }, [profile.heightUnit]);

  const weightItems = useMemo(() => {
    return (profile.weightUnit ?? "kg") === "kg"
      ? numericItems(30, 200, 1)
      : numericItems(66, 440, 1);
  }, [profile.weightUnit]);

  const heightSelected = useMemo(() => {
    if (!profile.heightCm) return "";
    return (profile.heightUnit ?? "cm") === "cm"
      ? String(Math.round(profile.heightCm))
      : cmToFt(profile.heightCm).toFixed(1);
  }, [profile.heightCm, profile.heightUnit]);

  const weightSelected = useMemo(() => {
    if (!profile.weightKg) return "";
    return (profile.weightUnit ?? "kg") === "kg"
      ? String(Math.round(profile.weightKg))
      : String(Math.round(kgToLb(profile.weightKg)));
  }, [profile.weightKg, profile.weightUnit]);

  const handleHeight = (v: string) => {
    const n = Number(v);
    if (isNaN(n)) return;
    const cm = (profile.heightUnit ?? "cm") === "cm" ? n : ftToCm(n);
    setProfile({ ...profile, heightCm: Math.round(cm) });
  };

  const handleWeight = (v: string) => {
    const n = Number(v);
    if (isNaN(n)) return;
    const kg = (profile.weightUnit ?? "kg") === "kg" ? n : lbToKg(n);
    setProfile({ ...profile, weightKg: Math.round(kg) });
  };

  const dobIsValid = isValidYMD(
    Number(dobYear),
    Number(dobMonth),
    Number(dobDay)
  );

  return (
    <>
      <ProfileAvatar profile={profile as any} setProfile={setProfile as any} />

      <ProfileField
        label="Username (shown in app)"
        textInputProps={{
          placeholder: "username",
          autoCapitalize: "none",
          value: profile.username,
          onChangeText: (v) => setProfile({ ...profile, username: v }),
        }}
      />

      <ProfileField
        label="Full name"
        textInputProps={{
          placeholder: "Your full name",
          value: profile.fullName,
          onChangeText: (v) => setProfile({ ...profile, fullName: v }),
        }}
      />

      <ProfileField
        label="Email"
        textInputProps={{
          placeholder: "you@example.com",
          autoCapitalize: "none",
          keyboardType: "email-address",
          value: profile.email,
          onChangeText: (v) => setProfile({ ...profile, email: v }),
        }}
      />

      {/* DOB */}
      <ProfileField label="Date of birth (DD-MM-YYYY)">
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
        {dobIsValid ? (
          <Text className="text-neutral-400 mt-2">
            Selected: {pad2(Number(dobDay))}-{pad2(Number(dobMonth))}-{dobYear}
          </Text>
        ) : (
          <Text className="text-neutral-500 mt-2">
            Select all three to set DOB
          </Text>
        )}
      </ProfileField>

      {/* Height */}
      <ProfileField
        label="Height"
        rightAccessory={
          <View style={{ width: 110 }}>
            <ProfileDropdown
              value={profile.heightUnit ?? "cm"}
              items={HEIGHT_UNITS}
              placeholderLabel="Unit"
              onChange={(u) => setProfile({ ...profile, heightUnit: u as any })}
            />
          </View>
        }>
        <ProfileDropdown
          value={heightSelected}
          items={heightItems}
          placeholderLabel="Value"
          onChange={handleHeight}
        />
      </ProfileField>

      {/* Weight */}
      <ProfileField
        label="Weight"
        rightAccessory={
          <View style={{ width: 110 }}>
            <ProfileDropdown
              value={profile.weightUnit ?? "kg"}
              items={WEIGHT_UNITS}
              placeholderLabel="Unit"
              onChange={(u) => setProfile({ ...profile, weightUnit: u as any })}
            />
          </View>
        }>
        <ProfileDropdown
          value={weightSelected}
          items={weightItems}
          placeholderLabel="Value"
          onChange={handleWeight}
        />
      </ProfileField>

      {/* Gender */}
      <ProfileField label="Gender">
        <ProfileDropdown
          value={profile.gender ?? "prefer_not_to_say"}
          items={GENDER_ITEMS}
          placeholderLabel="Select gender"
          onChange={(v) => setProfile({ ...profile, gender: v })}
        />
      </ProfileField>

      {/* Ethnicity */}
      <ProfileField label="Ethnicity">
        <ProfileDropdown
          value={profile.ethnicity ?? "not_specified"}
          items={ETHNICITY_ITEMS}
          placeholderLabel="Select ethnicity"
          onChange={(v) => setProfile({ ...profile, ethnicity: v })}
        />
      </ProfileField>

      {/* Activity level */}
      <ProfileField label="Activity level">
        <ProfileDropdown
          value={profile.activityLevel ?? "moderate"}
          items={ACTIVITY_LEVEL_ITEMS}
          placeholderLabel="Choose level"
          onChange={(v) => setProfile({ ...profile, activityLevel: v })}
        />
      </ProfileField>

      {/* Daily calorie goal */}
      <ProfileField label="Daily calorie goal (kcal)">
        <TextInput
          value={
            profile.dailyCalorieGoal ? String(profile.dailyCalorieGoal) : ""
          }
          onChangeText={(v) =>
            setProfile({
              ...profile,
              dailyCalorieGoal: v ? Number(v) : undefined,
            })
          }
          keyboardType="numeric"
          placeholder="e.g., 2000"
          placeholderTextColor="#9CA3AF"
          className="flex-1 bg-neutral-900 text-white rounded-lg px-3 py-3 border border-neutral-800"
        />
      </ProfileField>

      {/* Follow-up frequency */}
      <ProfileField label="Follow-up questions frequency">
        <ProfileDropdown
          value={profile.followUpFrequency ?? "daily"}
          items={FREQUENCY_ITEMS}
          placeholderLabel="Choose frequency"
          onChange={(v) =>
            setProfile({ ...profile, followUpFrequency: v as any })
          }
        />
      </ProfileField>

      {/* Fitness goal */}
      <ProfileField label="Fitness goal">
        <ProfileDropdown
          value={profile.fitnessGoal ?? "general_health"}
          items={FITNESS_GOAL_ITEMS}
          placeholderLabel="Select primary goal"
          onChange={(v) => setProfile({ ...profile, fitnessGoal: v as any })}
        />
      </ProfileField>

      {/* Notifications */}
      <ProfileRow>
        <Text className="text-white font-medium">Notifications</Text>
        <Switch
          value={profile.notifications}
          onValueChange={(v) => setProfile({ ...profile, notifications: v })}
        />
      </ProfileRow>
    </>
  );
}
