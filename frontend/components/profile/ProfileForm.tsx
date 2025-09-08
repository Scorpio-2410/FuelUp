import React, { useMemo } from "react";
import { View, Text, Switch } from "react-native";

import ProfileAvatar from "@/components/profile/ProfileAvatar";
import ProfileField from "@/components/profile/ProfileField";
import ProfileDropdown from "@/components/profile/ProfileDropdown";
import ProfileRow from "@/components/profile/ProfileRow";

import {
  ETHNICITY_ITEMS,
  FREQUENCY_ITEMS,
  FITNESS_GOAL_ITEMS,
  HEIGHT_UNITS,
  WEIGHT_UNITS,
} from "@/components/profile/profileConstants";

import type { Profile } from "@/app/(tabs)/user";

// ---------- Helpers ----------
const pad2 = (n: number) => String(n).padStart(2, "0");

const parseISO = (iso?: string) => {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
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

// build numeric item arrays (labels are just numbers)
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

// DOB items (three separate dropdowns)
const dayItems = numericItems(1, 31, 1, (v) => pad2(v));
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
  // ----- DOB (3 dropdowns inline) -----
  const dobParts = parseISO(profile.dob);
  const dd = dobParts ? pad2(dobParts.d) : "";
  const mm = dobParts ? pad2(dobParts.m) : "";
  const yyyy = dobParts ? String(dobParts.y) : "";

  const handleDobPart = (part: "d" | "m" | "y", v: string) => {
    const D = part === "d" ? Number(v) : Number(dd || "0");
    const M = part === "m" ? Number(v) : Number(mm || "0");
    const Y = part === "y" ? Number(v) : Number(yyyy || "0");
    if (isValidYMD(Y, M, D)) {
      setProfile({ ...profile, dob: toISO(Y, M, D) });
    } else {
      setProfile({ ...profile, dob: undefined });
    }
  };

  // ----- Height items (cm or ft) — labels are numbers only
  const heightItems = useMemo(() => {
    if ((profile.heightUnit ?? "cm") === "cm") {
      // 120–220 cm, integers
      return numericItems(120, 220, 1);
    } else {
      // 4.0–7.5 ft, step 0.1
      return numericItems(4.0, 7.5, 0.1, (v) => v.toFixed(1));
    }
  }, [profile.heightUnit]);

  // ----- Weight items (kg or lb) — labels are numbers only
  const weightItems = useMemo(() => {
    if ((profile.weightUnit ?? "kg") === "kg") {
      // 30–200 kg
      return numericItems(30, 200, 1);
    } else {
      // 66–440 lb
      return numericItems(66, 440, 1);
    }
  }, [profile.weightUnit]);

  // Display-selected values derived from canonical cm/kg
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

  // Handlers for height/weight changes
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

  return (
    <>
      <ProfileAvatar profile={profile as any} setProfile={setProfile as any} />

      {/* Username */}
      <ProfileField
        label="Username (shown in app)"
        textInputProps={{
          placeholder: "username",
          autoCapitalize: "none",
          value: profile.username,
          onChangeText: (v) => setProfile({ ...profile, username: v }),
        }}
      />

      {/* Full name */}
      <ProfileField
        label="Full name"
        textInputProps={{
          placeholder: "Your full name",
          value: profile.fullName,
          onChangeText: (v) => setProfile({ ...profile, fullName: v }),
        }}
      />

      {/* Email */}
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

      {/* DOB (three separate dropdowns) */}
      <ProfileField label="Date of birth (DD-MM-YYYY)">
        <View className="flex-row gap-3">
          <View style={{ flex: 1 }}>
            <ProfileDropdown
              value={dd}
              items={dayItems}
              placeholderLabel="DD"
              onChange={(v) => handleDobPart("d", v)}
            />
          </View>
          <View style={{ flex: 1.2 }}>
            <ProfileDropdown
              value={mm}
              items={monthItems}
              placeholderLabel="MM"
              onChange={(v) => handleDobPart("m", v)}
            />
          </View>
          <View style={{ flex: 1.2 }}>
            <ProfileDropdown
              value={yyyy}
              items={yearItems}
              placeholderLabel="YYYY"
              onChange={(v) => handleDobPart("y", v)}
            />
          </View>
        </View>
        {profile.dob ? (
          <Text className="text-neutral-400 mt-2">
            Selected:{" "}
            {dobParts
              ? `${pad2(dobParts.d)}-${pad2(dobParts.m)}-${dobParts.y}`
              : ""}
          </Text>
        ) : (
          <Text className="text-neutral-500 mt-2">
            Select all three to set DOB
          </Text>
        )}
      </ProfileField>

      {/* Height (dropdown + unit selector on right; options show numbers only) */}
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
          placeholderLabel={
            (profile.heightUnit ?? "cm") === "cm" ? "Value" : "Value"
          }
          onChange={handleHeight}
        />
      </ProfileField>

      {/* Weight (dropdown + unit selector on right; options show numbers only) */}
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

      {/* Ethnicity */}
      <ProfileField label="Ethnicity">
        <ProfileDropdown
          value={profile.ethnicity ?? "not_specified"}
          items={ETHNICITY_ITEMS}
          placeholderLabel="Select ethnicity"
          onChange={(v) => setProfile({ ...profile, ethnicity: v })}
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
