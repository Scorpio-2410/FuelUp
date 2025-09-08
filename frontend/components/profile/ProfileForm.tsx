import React, { useEffect, useMemo, useState } from "react";
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

// Accept strictly "YYYY-MM-DD"; ignore times/timezones by normalizing first
const parseISO = (iso?: string) => {
  if (!iso) return undefined;
  const only = String(iso).split("T")[0];
  const [y, m, d] = only.split("-").map(Number);
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

// month/year constants
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

// days in month helper
const daysInMonth = (y: number, m: number) => {
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
};

type Props = {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
};

export default function ProfileForm({ profile, setProfile }: Props) {
  // ----- Local DOB state so pickers don't reset while choosing -----
  const initialDob = parseISO(profile.dob);
  const [dobDay, setDobDay] = useState<string>(
    initialDob ? pad2(initialDob.d) : ""
  );
  const [dobMonth, setDobMonth] = useState<string>(
    initialDob ? pad2(initialDob.m) : ""
  );
  const [dobYear, setDobYear] = useState<string>(
    initialDob ? String(initialDob.y) : ""
  );

  // keep local DOB in sync if profile.dob changes from outside (e.g., server reload)
  useEffect(() => {
    const parts = parseISO(profile.dob);
    setDobDay(parts ? pad2(parts.d) : "");
    setDobMonth(parts ? pad2(parts.m) : "");
    setDobYear(parts ? String(parts.y) : "");
  }, [profile.dob]);

  // when any DOB part changes, write to profile only if valid; otherwise keep local-only
  const onDobChange = (part: "d" | "m" | "y", value: string) => {
    if (part === "d") setDobDay(value);
    if (part === "m") setDobMonth(value);
    if (part === "y") setDobYear(value);

    const D = Number(part === "d" ? value : dobDay || "0");
    const M = Number(part === "m" ? value : dobMonth || "0");
    const Y = Number(part === "y" ? value : dobYear || "0");

    if (isValidYMD(Y, M, D)) {
      setProfile({ ...profile, dob: toISO(Y, M, D) });
    }
  };

  // ----- Height items (cm or ft) — labels are numbers only
  const heightItems = useMemo(() => {
    if ((profile.heightUnit ?? "cm") === "cm") {
      return numericItems(120, 220, 1);
    } else {
      return numericItems(4.0, 7.5, 0.1, (v) => v.toFixed(1));
    }
  }, [profile.heightUnit]);

  // ----- Weight items (kg or lb) — labels are numbers only
  const weightItems = useMemo(() => {
    if ((profile.weightUnit ?? "kg") === "kg") {
      return numericItems(30, 200, 1);
    } else {
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

  // ----- Day items react to current month/year and (critically) use PADDED values -----
  const dynamicDayItems = useMemo(() => {
    const y = Number(dobYear || "0");
    const m = Number(dobMonth || "0");
    const max = daysInMonth(y, m || 1);
    // 👇 PAD both label and value so "03" matches items' values
    return Array.from({ length: max }, (_, i) => {
      const val = pad2(i + 1);
      return { label: val, value: val };
    });
  }, [dobMonth, dobYear]);

  const clampDayIfNeeded = (yStr: string, mStr: string) => {
    const y = Number(yStr || "0");
    const m = Number(mStr || "0");
    const max = daysInMonth(y, m || 1);
    if (dobDay && Number(dobDay) > max) {
      setDobDay(pad2(max));
      onDobChange("d", pad2(max));
    }
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
              value={dobDay || null}
              items={dynamicDayItems}
              placeholderLabel="DD"
              onChange={(v) => onDobChange("d", v ?? "")}
            />
          </View>
          <View style={{ flex: 1.2 }}>
            <ProfileDropdown
              value={dobMonth || null}
              items={monthItems}
              placeholderLabel="MM"
              onChange={(v) => {
                const next = v ?? "";
                clampDayIfNeeded(dobYear, next);
                onDobChange("m", next);
              }}
            />
          </View>
          <View style={{ flex: 1.2 }}>
            <ProfileDropdown
              value={dobYear || null}
              items={yearItems}
              placeholderLabel="YYYY"
              onChange={(v) => {
                const next = v ?? "";
                clampDayIfNeeded(next, dobMonth);
                onDobChange("y", next);
              }}
            />
          </View>
        </View>
        {profile.dob ? (
          <Text className="text-neutral-400 mt-2">
            Selected: {profile.dob.split("-").reverse().join("-")}
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
              onChange={(u) =>
                setProfile({ ...profile, heightUnit: (u ?? "cm") as any })
              }
            />
          </View>
        }>
        <ProfileDropdown
          value={heightSelected || null}
          items={heightItems}
          placeholderLabel="Value"
          onChange={(v) => handleHeight(v ?? "")}
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
              onChange={(u) =>
                setProfile({ ...profile, weightUnit: (u ?? "kg") as any })
              }
            />
          </View>
        }>
        <ProfileDropdown
          value={weightSelected || null}
          items={weightItems}
          placeholderLabel="Value"
          onChange={(v) => handleWeight(v ?? "")}
        />
      </ProfileField>

      {/* Ethnicity */}
      <ProfileField label="Ethnicity">
        <ProfileDropdown
          value={profile.ethnicity ?? "not_specified"}
          items={ETHNICITY_ITEMS}
          placeholderLabel="Select ethnicity"
          onChange={(v) =>
            setProfile({ ...profile, ethnicity: v ?? "not_specified" })
          }
        />
      </ProfileField>

      {/* Follow-up frequency */}
      <ProfileField label="Follow-up questions frequency">
        <ProfileDropdown
          value={profile.followUpFrequency ?? "daily"}
          items={FREQUENCY_ITEMS}
          placeholderLabel="Choose frequency"
          onChange={(v) =>
            setProfile({ ...profile, followUpFrequency: (v ?? "daily") as any })
          }
        />
      </ProfileField>

      {/* Fitness goal */}
      <ProfileField label="Fitness goal">
        <ProfileDropdown
          value={profile.fitnessGoal ?? "general_health"}
          items={FITNESS_GOAL_ITEMS}
          placeholderLabel="Select primary goal"
          onChange={(v) =>
            setProfile({
              ...profile,
              fitnessGoal: (v ?? "general_health") as any,
            })
          }
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
