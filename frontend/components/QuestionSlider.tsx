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
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(0.5);
  const trackW = useSharedValue(1);
  const lastProgressRef = useRef(0.5);
  const startXRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);
  const uiUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUiValueRef = useRef<number | null>(null);

  const stepCount = maxValue - minValue + 1;

  // Animate progress when value changes programmatically
  useEffect(() => {
    const p = (value - minValue) / (stepCount - 1);
    lastProgressRef.current = p;
    if (!isDragging) {
      progress.value = withTiming(p, { duration: 180 });
    }
  }, [value, isDragging, minValue, stepCount]);

  // Cleanup any pending UI debounce on unmount
  useEffect(() => {
    return () => {
      if (uiUpdateTimeoutRef.current) {
        clearTimeout(uiUpdateTimeoutRef.current);
        uiUpdateTimeoutRef.current = null;
      }
    };
  }, []);

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

  const handleSliderChange = (newValue: number, commit: boolean = true) => {
    if (commit) {
      onValueChange(newValue);
      if (uiUpdateTimeoutRef.current) {
        clearTimeout(uiUpdateTimeoutRef.current);
        uiUpdateTimeoutRef.current = null;
      }
    } else {
      pendingUiValueRef.current = newValue;
    }
  };

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
      <View>
        <Text style={{ color: "#a1a1aa", fontSize: 28, fontWeight: "500" }}>
          {" "}
          {value}{" "}
        </Text>
      </View>
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
          const w = e.nativeEvent.layout.width;
          setTrackWidth(w);
          trackW.value = w;
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          const { locationX } = event.nativeEvent;
          startXRef.current = locationX;
          hasDraggedRef.current = false;
          setIsDragging(true);
        }}
        onResponderMove={(event) => {
          const { locationX } = event.nativeEvent;
          const delta = Math.abs(locationX - startXRef.current);
          if (!hasDraggedRef.current && delta < 6) {
            return;
          }

          hasDraggedRef.current = true;
          const clamped = Math.max(0, Math.min(trackW.value, locationX));
          const p = clamped / trackW.value;
          lastProgressRef.current = p;
          progress.value = p;

          const liveValue = Math.round(p * (stepCount - 1)) + minValue;
          if (liveValue !== value) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            pendingUiValueRef.current = liveValue;
            if (uiUpdateTimeoutRef.current) {
              clearTimeout(uiUpdateTimeoutRef.current);
            }
            uiUpdateTimeoutRef.current = setTimeout(() => {
              if (pendingUiValueRef.current != null) {
                handleSliderChange(pendingUiValueRef.current, false);
              }
              uiUpdateTimeoutRef.current = null;
            }, 200);
          }
          value = liveValue;
        }}
        onResponderRelease={() => {
          if (!hasDraggedRef.current) {
            const pSaved = (value - minValue) / (stepCount - 1);
            progress.value = withTiming(pSaved, { duration: 120 });
          } else {
            const snappedStep = Math.round(
              lastProgressRef.current * (stepCount - 1)
            );
            const snappedP = snappedStep / (stepCount - 1);
            progress.value = withTiming(snappedP, { duration: 120 });
            const newValue = snappedStep + minValue;
            if (uiUpdateTimeoutRef.current) {
              clearTimeout(uiUpdateTimeoutRef.current);
              uiUpdateTimeoutRef.current = null;
            }
            handleSliderChange(newValue, true);
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
