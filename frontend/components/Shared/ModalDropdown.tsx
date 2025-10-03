import React, { useState } from "react";
import { View, Text, Pressable, Modal, ScrollView } from "react-native";

type ModalDropdownOption = { label: string; value: string };

type ModalDropdownProps = {
  label?: string;
  value: string;
  onSelect: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  disabled?: boolean;
};

export default function ModalDropdown({
  label,
  value,
  onSelect,
  options,
  placeholder = "Select",
  disabled = false,
}: ModalDropdownProps) {
  const [open, setOpen] = useState(false);
  const displayLabel = value
    ? options.find((o: ModalDropdownOption) => o.value === value)?.label ||
      value
    : placeholder;
  return (
    <View style={{ marginBottom: 16 }}>
      {label ? (
        <Text style={{ color: "#9CA3AF", marginBottom: 8 }}>{label}</Text>
      ) : null}
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        style={{
          backgroundColor: "#1a1a1a",
          borderColor: "#262626",
          borderWidth: 1,
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
        disabled={disabled}
      >
        <Text style={{ color: value ? "white" : "#9CA3AF" }}>
          {displayLabel}
        </Text>
      </Pressable>
      <Modal visible={open} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.7)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              maxHeight: "60%",
              backgroundColor: "#111",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={{ color: "white", fontSize: 18, fontWeight: "bold" }}
              >
                {getHeading(placeholder)}
              </Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text style={{ color: "#22d3ee", fontSize: 16 }}>Done</Text>
              </Pressable>
            </View>
            <ScrollView>
              {options.map((opt: ModalDropdownOption) => (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onSelect(opt.value);
                    setOpen(false);
                  }}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: "#262626",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 16 }}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Map placeholder to heading
const getHeading = (placeholder: string) => {
  switch (placeholder) {
    case "DD":
      return "Day";
    case "MM":
      return "Month";
    case "YYYY":
      return "Year";
    case "Select Gender":
      return "Gender";
    case "Select ethnicity":
      return "Ethnicity";
    case "Choose frequency":
      return "Frequency";
    default:
      return placeholder;
  }
};
