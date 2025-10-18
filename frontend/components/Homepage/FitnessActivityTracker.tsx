// Fitness Activity Tracker Component
// Allows users to log fitness activities and track calories burned

import React, { useState, forwardRef, useImperativeHandle } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFitnessActivities } from "../../hooks/useFitnessActivities";

interface FitnessActivityTrackerProps {
  className?: string;
  onRefresh?: () => void;
  date?: string; // YYYY-MM-DD format, defaults to today
}

const FitnessActivityTracker = forwardRef<any, FitnessActivityTrackerProps>(
  ({ className, onRefresh, date }, ref) => {
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
      activityType: "cardio" as
        | "cardio"
        | "strength"
        | "flexibility"
        | "sports"
        | "other",
      exerciseName: "",
      durationMinutes: "",
      caloriesBurned: "",
      intensity: "moderate" as "low" | "moderate" | "high" | "very_high",
      notes: "",
    });

    const targetDate = date || new Date().toISOString().split("T")[0];

    const {
      activities,
      totalCalories,
      loading,
      error,
      createActivity,
      refresh,
    } = useFitnessActivities({ date: targetDate });

    const handleSubmit = async () => {
      if (
        !formData.exerciseName.trim() ||
        !formData.durationMinutes ||
        !formData.caloriesBurned
      ) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      const result = await createActivity({
        activityType: formData.activityType,
        exerciseName: formData.exerciseName.trim(),
        durationMinutes: parseInt(formData.durationMinutes),
        caloriesBurned: parseInt(formData.caloriesBurned),
        intensity: formData.intensity,
        notes: formData.notes.trim() || undefined,
      });

      if (result.success) {
        setShowModal(false);
        setFormData({
          activityType: "cardio",
          exerciseName: "",
          durationMinutes: "",
          caloriesBurned: "",
          intensity: "moderate",
          notes: "",
        });
        onRefresh?.();
      } else {
        Alert.alert("Error", result.error || "Failed to add activity");
      }
    };

    const getActivityTypeColor = (type: string) => {
      switch (type) {
        case "cardio":
          return "#ef4444";
        case "strength":
          return "#3b82f6";
        case "flexibility":
          return "#10b981";
        case "sports":
          return "#f59e0b";
        default:
          return "#6b7280";
      }
    };

    const getIntensityColor = (intensity: string) => {
      switch (intensity) {
        case "low":
          return "#10b981";
        case "moderate":
          return "#f59e0b";
        case "high":
          return "#ef4444";
        case "very_high":
          return "#dc2626";
        default:
          return "#6b7280";
      }
    };

    // Expose refresh function for external use
    useImperativeHandle(ref, () => ({
      refresh,
    }));

    return (
      <View
        className={`p-6 rounded-2xl ${className}`}
        style={{ backgroundColor: "rgba(42, 42, 42, 0.1)" }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-semibold">
            Fitness Activities
          </Text>
          <Pressable
            onPress={() => setShowModal(true)}
            className="bg-green-600 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-white ml-1 font-medium">Add</Text>
          </Pressable>
        </View>

        {/* Total Calories */}
        <View className="mb-4">
          <View className="flex-row items-center mb-1">
            <View
              className="w-3 h-3 rounded-full mr-3"
              style={{ backgroundColor: "#f59e0b" }}
            />
            <Text className="text-white text-xl font-semibold">
              {totalCalories} cal
            </Text>
          </View>
          <Text style={{ color: "#a0a0a0" }} className="text-sm ml-6">
            Burned Today
          </Text>
        </View>

        {/* Activities List */}
        <ScrollView className="max-h-48" showsVerticalScrollIndicator={false}>
          {loading ? (
            <Text className="text-gray-400 text-center py-4">
              Loading activities...
            </Text>
          ) : activities.length === 0 ? (
            <Text className="text-gray-400 text-center py-4">
              No activities logged today
            </Text>
          ) : (
            activities.map((activity) => (
              <View
                key={activity.id}
                className="bg-gray-800 p-3 rounded-lg mb-2"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-white font-medium">
                      {activity.exerciseName}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <View
                        className="w-2 h-2 rounded-full mr-2"
                        style={{
                          backgroundColor: getActivityTypeColor(
                            activity.activityType
                          ),
                        }}
                      />
                      <Text className="text-gray-400 text-xs capitalize">
                        {activity.activityType} • {activity.durationMinutes}min
                      </Text>
                      <View
                        className="w-2 h-2 rounded-full ml-2 mr-1"
                        style={{
                          backgroundColor: getIntensityColor(
                            activity.intensity
                          ),
                        }}
                      />
                      <Text className="text-gray-400 text-xs capitalize">
                        {activity.intensity}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-orange-400 font-semibold">
                    {activity.caloriesBurned} cal
                  </Text>
                </View>
                {activity.notes && (
                  <Text className="text-gray-500 text-xs mt-1">
                    {activity.notes}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>

        {/* Add Activity Modal */}
        <Modal
          visible={showModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View className="flex-1 bg-gray-900">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-700">
              <Text className="text-white text-xl font-semibold">
                Add Activity
              </Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 p-4">
              {/* Activity Type */}
              <View className="mb-4">
                <Text className="text-white text-sm font-medium mb-2">
                  Activity Type
                </Text>
                <View className="flex-row flex-wrap">
                  {["cardio", "strength", "flexibility", "sports", "other"].map(
                    (type) => (
                      <Pressable
                        key={type}
                        onPress={() =>
                          setFormData((prev) => ({
                            ...prev,
                            activityType: type as any,
                          }))
                        }
                        className={`px-4 py-2 rounded-lg mr-2 mb-2 ${
                          formData.activityType === type
                            ? "bg-blue-600"
                            : "bg-gray-700"
                        }`}
                      >
                        <Text className="text-white capitalize">{type}</Text>
                      </Pressable>
                    )
                  )}
                </View>
              </View>

              {/* Exercise Name */}
              <View className="mb-4">
                <Text className="text-white text-sm font-medium mb-2">
                  Exercise Name *
                </Text>
                <TextInput
                  value={formData.exerciseName}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, exerciseName: text }))
                  }
                  placeholder="e.g., Running, Weight Lifting, Yoga"
                  placeholderTextColor="#6b7280"
                  className="bg-gray-800 text-white p-3 rounded-lg"
                />
              </View>

              {/* Duration */}
              <View className="mb-4">
                <Text className="text-white text-sm font-medium mb-2">
                  Duration (minutes) *
                </Text>
                <TextInput
                  value={formData.durationMinutes}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, durationMinutes: text }))
                  }
                  placeholder="30"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  className="bg-gray-800 text-white p-3 rounded-lg"
                />
              </View>

              {/* Calories Burned */}
              <View className="mb-4">
                <Text className="text-white text-sm font-medium mb-2">
                  Calories Burned *
                </Text>
                <TextInput
                  value={formData.caloriesBurned}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, caloriesBurned: text }))
                  }
                  placeholder="300"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  className="bg-gray-800 text-white p-3 rounded-lg"
                />
              </View>

              {/* Intensity */}
              <View className="mb-4">
                <Text className="text-white text-sm font-medium mb-2">
                  Intensity
                </Text>
                <View className="flex-row flex-wrap">
                  {["low", "moderate", "high", "very_high"].map((intensity) => (
                    <Pressable
                      key={intensity}
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          intensity: intensity as any,
                        }))
                      }
                      className={`px-4 py-2 rounded-lg mr-2 mb-2 ${
                        formData.intensity === intensity
                          ? "bg-blue-600"
                          : "bg-gray-700"
                      }`}
                    >
                      <Text className="text-white capitalize">
                        {intensity.replace("_", " ")}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Notes */}
              <View className="mb-6">
                <Text className="text-white text-sm font-medium mb-2">
                  Notes (optional)
                </Text>
                <TextInput
                  value={formData.notes}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, notes: text }))
                  }
                  placeholder="Any additional notes..."
                  placeholderTextColor="#6b7280"
                  multiline
                  numberOfLines={3}
                  className="bg-gray-800 text-white p-3 rounded-lg"
                />
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                className="bg-green-600 py-4 rounded-lg"
              >
                <Text className="text-white text-center font-semibold text-lg">
                  Add Activity
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </Modal>
      </View>
    );
  }
);

FitnessActivityTracker.displayName = "FitnessActivityTracker";

export default FitnessActivityTracker;
