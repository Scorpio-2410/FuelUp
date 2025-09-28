import React, { useState, useEffect, useRef } from "react";
import { View, Text } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface QuestionSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  emojis: string[];
  feedbackTexts: string[];
  minValue?: number;
  maxValue?: number;
}

export default function QuestionSlider({
  value,
  onValueChange,
  emojis,
  feedbackTexts,
  minValue = 1,
  maxValue = 5,
}: QuestionSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const progress = useSharedValue(0.5);
  const trackW = useSharedValue(1);
  const startXRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);
  const trackXRef = useRef<number>(0);

  const stepCount = maxValue - minValue + 1;

  // Update progress when value changes (but not during drag)
  useEffect(() => {
    if (!isDragging) {
      const p = (value - minValue) / (stepCount - 1);
      progress.value = withTiming(p, { duration: 180 });
    }
  }, [value, isDragging, minValue, stepCount]);

  // Animated styles for fill and thumb
  const fillAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: Math.max(0, trackW.value * progress.value),
    };
  });

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      left: Math.min(
        trackW.value - 10,
        Math.max(-10, trackW.value * progress.value - 10)
      ),
    };
  });

  const getFeedbackText = () => {
    const index = value - minValue;
    return feedbackTexts[index] || feedbackTexts[feedbackTexts.length - 1];
  };

  return (
    <View
      style={{
        alignItems: "center",
        paddingVertical: 24,
        marginTop: 80,
      }}
    >
      {/* Slider Labels */}
      {/* <View>
        <Text style={{ color: "#a1a1aa", fontSize: 28, fontWeight: "500" }}>
          {" "}
          {value}{" "}
        </Text>
      </View> */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          marginBottom: 16,
        }}
      >
        {emojis.map((emoji, index) => (
          <Text
            key={index}
            style={{
              color: "#a1a1aa",
              fontSize: 28,
              fontWeight: "500",
            }}
          >
            {emoji}
          </Text>
        ))}
      </View>

      {/* Slider Track */}
      <View
        style={{
          width: "100%",
          height: 8,
          backgroundColor: "#3f3f46",
          borderRadius: 4,
          marginBottom: 24,
          position: "relative",
        }}
        onLayout={(e) => {
          const { width, x } = e.nativeEvent.layout;
          trackW.value = width;
          trackXRef.current = x;
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          const { pageX } = event.nativeEvent;
          startXRef.current = pageX;
          hasDraggedRef.current = false;
          setIsDragging(true);
        }}
        onResponderMove={(event) => {
          const { pageX } = event.nativeEvent;
          const dragDistance = Math.abs(pageX - startXRef.current);

          // Only start dragging after moving 6px
          if (!hasDraggedRef.current && dragDistance < 6) return;

          hasDraggedRef.current = true;

          // Calculate relative position within the track
          const relativeX = pageX - trackXRef.current;
          const clampedX = Math.max(0, Math.min(trackW.value, relativeX));
          const newProgress = clampedX / trackW.value;
          progress.value = newProgress;

          // Update value if changed
          const newValue = Math.round(newProgress * (stepCount - 1)) + minValue;
          if (newValue !== value) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onValueChange(newValue);
          }
        }}
        onResponderRelease={() => {
          if (hasDraggedRef.current) {
            // Snap to nearest step after dragging
            const finalValue =
              Math.round(progress.value * (stepCount - 1)) + minValue;
            const snapProgress = (finalValue - minValue) / (stepCount - 1);
            progress.value = withTiming(snapProgress, { duration: 120 });
            onValueChange(finalValue);
          } else {
            // Revert to original position if no drag
            const originalProgress = (value - minValue) / (stepCount - 1);
            progress.value = withTiming(originalProgress, { duration: 120 });
          }
          setIsDragging(false);
        }}
      >
        <Animated.View
          style={[
            {
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              backgroundColor: "#C8FE3B",
              borderRadius: 4,
              width: 0,
            },
            fillAnimatedStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              width: 20,
              height: 20,
              backgroundColor: "#FFE53B",
              borderRadius: 10,
              borderWidth: 3,
              borderColor: "white",
              marginTop: -6,
              left: -10,
            },
            thumbAnimatedStyle,
          ]}
        />
        <Text
          style={{
            position: "absolute",
            marginTop: 50,
            fontSize: 22,
            fontWeight: "500",
            color: "#C8FE3B",
            textAlign: "center",
            width: "100%",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {getFeedbackText()}
        </Text>
      </View>
    </View>
  );
}
