// Daily Calorie Summary Component
// Displays daily calorie intake vs. target with progress visualization
// Integrates meal data and fitness activity (steps) data

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import {
  apiGetDailyCalorieSummary,
  DailyCalorieSummary as DailyCalorieSummaryType,
} from "../../constants/api";

interface DailyCalorieSummaryProps {
  className?: string;
  onRefresh?: () => void;
  date?: string; // YYYY-MM-DD format, defaults to today
}

const DailyCalorieSummary = forwardRef<any, DailyCalorieSummaryProps>(
  ({ className, onRefresh, date }, ref) => {
    const [summary, setSummary] = useState<DailyCalorieSummaryType | null>(
      null
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const targetDate = date || new Date().toISOString().split("T")[0];

    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiGetDailyCalorieSummary(targetDate);
        if (response.ok) {
          setSummary(response.summary);
        } else {
          setError("Failed to load calorie data");
        }
      } catch (err) {
        console.error("Error fetching daily calorie summary:", err);
        setError("Failed to load calorie data");
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchSummary();
    }, [targetDate]);

    // Expose refresh function for external use
    useImperativeHandle(ref, () => ({
      refresh: fetchSummary,
    }));

    const getProgressColor = (progress: number, isOverTarget: boolean) => {
      if (isOverTarget) return "#ef4444"; // Red for over target
      if (progress >= 90) return "#f59e0b"; // Orange for close to target
      if (progress >= 70) return "#10b981"; // Green for good progress
      return "#6b7280"; // Gray for low progress
    };

    const getStatusText = (progress: number, isOverTarget: boolean) => {
      if (isOverTarget) return "Over Target";
      if (progress >= 100) return "Target Met!";
      if (progress >= 90) return "Almost There";
      if (progress >= 70) return "Good Progress";
      return "Keep Going";
    };

    if (loading) {
      return (
        <View
          className={`p-6 rounded-2xl ${className}`}
          style={{ backgroundColor: "rgba(42, 42, 42, 0.1)" }}
        >
          <View className="flex-row items-center justify-center">
            <ActivityIndicator size="small" color="#10b981" />
            <Text className="text-white ml-2">Loading calorie data...</Text>
          </View>
        </View>
      );
    }

    if (error || !summary) {
      return (
        <View
          className={`p-6 rounded-2xl ${className}`}
          style={{ backgroundColor: "rgba(42, 42, 42, 0.1)" }}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
            <Text className="text-red-400 ml-2">
              {error || "No data available"}
            </Text>
            <Pressable onPress={fetchSummary} className="ml-2">
              <Ionicons name="refresh" size={20} color="#10b981" />
            </Pressable>
          </View>
        </View>
      );
    }

    const progressColor = getProgressColor(
      summary.progress,
      summary.isOverTarget
    );
    const circumference = 2 * Math.PI * 60; // radius = 60
    const strokeDasharray = `${
      (summary.progress / 100) * circumference
    } ${circumference}`;

    return (
      <View
        className={`p-6 rounded-2xl ${className}`}
        style={{ backgroundColor: "rgba(42, 42, 42, 0.1)" }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-semibold">
            Daily Calories
          </Text>
          <Pressable onPress={fetchSummary}>
            <Ionicons name="refresh" size={20} color="#10b981" />
          </Pressable>
        </View>

        <View className="flex-row items-center">
          {/* Left side - Stats */}
          <View className="flex-1 pr-4">
            {/* Target */}
            <View className="mb-4">
              <View className="flex-row items-center mb-1">
                <View
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: "#10b981" }}
                />
                <Text className="text-white text-xl font-semibold">
                  {summary.target.toLocaleString()} cal
                </Text>
              </View>
              <Text style={{ color: "#a0a0a0" }} className="text-sm ml-6">
                Target
              </Text>
            </View>

            {/* Consumed */}
            <View className="mb-4">
              <View className="flex-row items-center mb-1">
                <View
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: progressColor }}
                />
                <Text className="text-white text-xl font-semibold">
                  {summary.consumed.toLocaleString()} cal
                </Text>
              </View>
              <Text style={{ color: "#a0a0a0" }} className="text-sm ml-6">
                Consumed
              </Text>
            </View>

            {/* Burned */}
            <View className="mb-4">
              <View className="flex-row items-center mb-1">
                <View
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: "#f59e0b" }}
                />
                <Text className="text-white text-xl font-semibold">
                  {summary.burned.toLocaleString()} cal
                </Text>
              </View>
              <Text style={{ color: "#a0a0a0" }} className="text-sm ml-6">
                Burned
              </Text>
            </View>

            {/* Net Calories */}
            <View className="mb-2">
              <View className="flex-row items-center mb-1">
                <View
                  className="w-3 h-3 rounded-full mr-3"
                  style={{
                    backgroundColor:
                      summary.netCalories >= 0 ? "#3b82f6" : "#ef4444",
                  }}
                />
                <Text className="text-white text-lg font-semibold">
                  {summary.netCalories >= 0 ? "+" : ""}
                  {summary.netCalories.toLocaleString()} cal
                </Text>
              </View>
              <Text style={{ color: "#a0a0a0" }} className="text-sm ml-6">
                Net
              </Text>
            </View>

            {/* Status */}
            <Text
              className="text-sm font-medium ml-6"
              style={{ color: progressColor }}
            >
              {getStatusText(summary.progress, summary.isOverTarget)}
            </Text>
          </View>

          {/* Right side - Progress Circle */}
          <View className="relative items-center justify-center">
            <Svg width="140" height="140">
              {/* Background circle */}
              <Circle
                cx="70"
                cy="70"
                r="60"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Progress circle */}
              <Circle
                cx="70"
                cy="70"
                r="60"
                stroke={progressColor}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
              />
            </Svg>
            {/* Progress percentage in center */}
            <View className="absolute items-center justify-center">
              <Text className="text-white text-2xl font-bold">
                {summary.progress}%
              </Text>
              <Text className="text-gray-400 text-xs">of target</Text>
            </View>
          </View>
        </View>

        {/* Remaining calories */}
        {!summary.isOverTarget && summary.remaining > 0 && (
          <View
            className="mt-4 p-3 rounded-lg"
            style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}
          >
            <Text className="text-green-400 text-sm text-center">
              {summary.remaining.toLocaleString()} calories remaining to reach
              your goal
            </Text>
          </View>
        )}

        {/* Over target warning */}
        {summary.isOverTarget && (
          <View
            className="mt-4 p-3 rounded-lg"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
          >
            <Text className="text-red-400 text-sm text-center">
              You've exceeded your daily target by{" "}
              {(summary.consumed - summary.target).toLocaleString()} calories
            </Text>
          </View>
        )}
      </View>
    );
  }
);

DailyCalorieSummary.displayName = "DailyCalorieSummary";

export default DailyCalorieSummary;
