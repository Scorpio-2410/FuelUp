//app/(tabs)/targetquestions.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface Question {
  id: number;
  question: string;
  options: string[];
  isSlider?: boolean;
}

const randomDailyQuestions: Question[] = [
  {
    id: 1,
    question: "How well are we sleeping?",
    options: ["Poorly", "Not bad", "Well", "Excellent!"],
  },
  {
    id: 2,
    question: "How long do you want to exercise today?",
    options: [
      "Less than 30 minutes",
      "30-60 minutes",
      "60-90 minutes",
      "More than 90 minutes",
    ],
  },
  {
    id: 3,
    question: "What's is our stress level today?",
    options: ["1", "2", "3", "4"],
    isSlider: true,
  },
  {
    id: 4,
    question: "Are you feeling any soreness from your last workout?",
    options: ["Yes", "No"],
  },
  {
    id: 5,
    question: "How do you feel about your progress so far?",
    options: ["Slow", "Just right", "Fast", "Amazing!"],
  },
  {
    id: 6,
    question: "Do have any food cravings today?",
    options: ["Sweets", "Savoury", "None"],
  },
  {
    id: 7,
    question: "How would you rate your hydration today?",
    options: ["Low", "Just right", "High"],
  },
];

const mainQuestions: Question[] = [
  //will be changed to adapt to the user's goals and preferences
  {
    id: 1,
    question: "What's our workout for today?",
    options: ["Strength", "Cardio", "Recovery", "Sorry, not today"],
  },
  {
    id: 2,
    question: "Plans for our meals?",
    options: [
      "Low-carb",
      "High Protein",
      "Balanced",
      "Eating out",
      "Something different",
    ],
  },
  {
    id: 3,
    question: "How's our energy levels today?",
    options: ["1", "2", "3", "4", "5"],
    isSlider: true,
  },
];

export default function QuestionSegment() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [sliderValue, setSliderValue] = useState(3);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(0.5); // 0..1
  const trackW = useSharedValue(1);
  const lastProgressRef = React.useRef(0.5);
  const pendingAnswerRef = React.useRef<number | null>(null);
  const startXRef = React.useRef<number>(0);
  const hasDraggedRef = React.useRef<boolean>(false);
  const uiUpdateTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const pendingUiValueRef = React.useRef<number | null>(null);

  // Initialize questions with random daily questions
  useEffect(() => {
    const generateQuestions = () => {
      // Get 1-2 random questions from randomDailyQuestions
      const shuffled = [...randomDailyQuestions].sort(
        () => 0.5 - Math.random()
      );
      const randomCount = Math.floor(Math.random() * 2) + 1; // 1 or 2
      const selectedRandomQuestions = shuffled.slice(0, randomCount);

      // Combine random questions with main questions
      const allQuestions = [...selectedRandomQuestions, ...mainQuestions];

      // Shuffle the combined array for variety
      const finalQuestions = allQuestions.sort(() => 0.5 - Math.random());

      setQuestions(finalQuestions);
    };

    generateQuestions();
  }, []);

  const currentQuestion = questions[currentQuestionIndex];

  // Initialize slider value when component loads or when navigating to slider question
  useEffect(() => {
    if (currentQuestion?.isSlider) {
      const savedValue = answers[currentQuestion.id];
      if (savedValue !== undefined) {
        setSliderValue(savedValue + 1);
        setSelectedOption(savedValue);
      } else {
        setSliderValue(3); // Default to middle value
        setSelectedOption(2); // Default to middle option (index 2)
      }
    }
  }, [
    currentQuestionIndex,
    currentQuestion?.isSlider,
    currentQuestion?.id,
    answers,
  ]);

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleSliderChange = (value: number, commit: boolean = true) => {
    setSliderValue(value);
    const optionIndex = Math.round(value) - 1; // Convert 1-5 to 0-4 index
    if (commit) {
      setSelectedOption(optionIndex);
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: optionIndex,
      }));
      pendingAnswerRef.current = null;
    } else {
      pendingAnswerRef.current = optionIndex;
    }
  };
  // Cleanup any pending UI debounce on unmount
  useEffect(() => {
    return () => {
      if (uiUpdateTimeoutRef.current) {
        clearTimeout(uiUpdateTimeoutRef.current);
        uiUpdateTimeoutRef.current = null;
      }
    };
  }, []);

  // Animate progress when sliderValue changes programmatically
  useEffect(() => {
    const p = (sliderValue - 1) / 4;
    lastProgressRef.current = p;
    // Avoid fighting with drag updates
    if (!isDragging) {
      progress.value = withTiming(p, { duration: 180 });
    }
  }, [sliderValue, isDragging]);

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

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      const nextQuestion = questions[currentQuestionIndex + 1];
      setSelectedOption(answers[nextQuestion.id] || null);
      if (nextQuestion.isSlider) {
        setSliderValue((answers[nextQuestion.id] || 2) + 1); // Convert 0-4 index to 1-5 value
      }
    } else {
      // All questions completed, navigate to results or next section
      Alert.alert(
        "Got it! I'll adjust your goals for today and get you started! 😊"
      );
      router.push("/homepage");
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevQuestion = questions[currentQuestionIndex - 1];
      setSelectedOption(answers[prevQuestion.id] || null);
      if (prevQuestion.isSlider) {
        setSliderValue((answers[prevQuestion.id] || 2) + 1); // Convert 0-4 index to 1-5 value
      }
    }
  };

  // Don't render until questions are loaded
  if (questions.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#1a1a1a",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 18 }}>
          Loading questions...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 20, paddingTop: 80 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            style={{
              padding: 12,
              borderRadius: 12,
              width: 48,
              height: 48,
              alignItems: "center",
              justifyContent: "center",
              marginRight: "auto",
              opacity: currentQuestionIndex === 0 ? 0 : 1,
            }}
            onPress={handlePrevious}
          >
            <FontAwesome name="arrow-left" size={20} color="#d4d4d8" />
          </TouchableOpacity>

          {/* Question Container */}
          <View
            style={{ flex: 1, justifyContent: "center", marginTop: "auto" }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 24,
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 100,
                lineHeight: 32,
                marginTop: 10,
              }}
            >
              {currentQuestion.question}
            </Text>

            {/* Options Container */}
            <View style={{ gap: 16, marginTop: 40 }}>
              {currentQuestion.isSlider ? (
                <View
                  style={{
                    alignItems: "center",
                    paddingVertical: 24,
                    marginTop: 80,
                  }}
                >
                  {/* Slider Labels */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      width: "100%",
                      marginBottom: 16,
                    }}
                  >
                    {["💤", "🥲", "😄", "⚡️", "🔥"].map((value) => (
                      <Text
                        key={value}
                        style={{
                          color: "#a1a1aa",
                          fontSize: 28,
                          fontWeight: "500",
                        }}
                      >
                        {value}
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
                      // Record start and wait for drag threshold before updating
                      startXRef.current = locationX;
                      hasDraggedRef.current = false;
                      setIsDragging(true);
                    }}
                    onResponderMove={(event) => {
                      const { locationX } = event.nativeEvent;
                      const delta = Math.abs(locationX - startXRef.current);
                      // Require small movement before treating as drag (disables tap-to-set)
                      if (!hasDraggedRef.current && delta < 6) {
                        return;
                      }
                      hasDraggedRef.current = true;
                      const clamped = Math.max(
                        0,
                        Math.min(trackW.value, locationX)
                      );
                      const p = clamped / trackW.value;
                      lastProgressRef.current = p;
                      progress.value = p; // live follow
                      // Update UI value only (no commit) to avoid re-render jitter
                      const liveValue = Math.round(p * 4) + 1;
                      if (liveValue !== sliderValue) {
                        pendingUiValueRef.current = liveValue;
                        if (uiUpdateTimeoutRef.current) {
                          clearTimeout(uiUpdateTimeoutRef.current);
                        }
                        uiUpdateTimeoutRef.current = setTimeout(() => {
                          if (pendingUiValueRef.current != null) {
                            // only reflect in UI, do not commit answers while dragging
                            setSliderValue(pendingUiValueRef.current);
                          }
                          uiUpdateTimeoutRef.current = null;
                        }, 200);
                      }
                    }}
                    onResponderRelease={() => {
                      if (!hasDraggedRef.current) {
                        // No drag occurred — revert visual back to saved value
                        const pSaved = (sliderValue - 1) / 4;
                        progress.value = withTiming(pSaved, { duration: 120 });
                      } else {
                        const snappedStep = Math.round(
                          lastProgressRef.current * 4
                        );
                        const snappedP = snappedStep / 4;
                        progress.value = withTiming(snappedP, {
                          duration: 120,
                        });
                        const newValue = snappedStep + 1;
                        // Commit once on release
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
                      {sliderValue === 1
                        ? "Not so good..."
                        : sliderValue === 2
                        ? "So-so"
                        : sliderValue === 3
                        ? "I'm good!"
                        : sliderValue === 4
                        ? "I'm raring to go!"
                        : "Let's do this!!!"}
                    </Text>
                  </View>
                </View>
              ) : (
                currentQuestion.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={{
                      padding: 20,
                      borderRadius: 12,
                      borderWidth: 2,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      borderColor:
                        selectedOption === index ? "black" : "#3f3f46",
                      backgroundColor:
                        selectedOption === index ? "#C8FE3B" : "#262626",
                    }}
                    onPress={() => handleOptionSelect(index)}
                  >
                    {/* Icon based on question and option */}
                    {currentQuestion.id === 1 && (
                      <FontAwesome
                        name={
                          option === "Strength"
                            ? "bolt"
                            : option === "Cardio"
                            ? "heartbeat"
                            : option === "Recovery"
                            ? "bed"
                            : "times"
                        }
                        size={20}
                        color={selectedOption === index ? "black" : "#a1a1aa"}
                        style={{ marginRight: 12 }}
                      />
                    )}
                    {currentQuestion.id === 2 && (
                      <FontAwesome
                        name={
                          option === "Low-carb"
                            ? "leaf"
                            : option === "High Protein"
                            ? "check"
                            : option === "Balanced"
                            ? "balance-scale"
                            : option === "Eating out"
                            ? "cutlery"
                            : "globe"
                        }
                        size={20}
                        color={selectedOption === index ? "black" : "#a1a1aa"}
                        style={{ marginRight: 12 }}
                      />
                    )}
                    {/* Icons for random daily questions
                    {currentQuestion.question.includes("sleeping") && (
                      <FontAwesome
                        name="bed"
                        size={20}
                        color={selectedOption === index ? "black" : "#a1a1aa"}
                        style={{ marginRight: 12 }}
                      />
                    )}
                    {currentQuestion.question.includes("exercise") && (
                      <FontAwesome
                        name="clock-o"
                        size={20}
                        color={selectedOption === index ? "black" : "#a1a1aa"}
                        style={{ marginRight: 12 }}
                      />
                    )}
                    {currentQuestion.question.includes("stress") && (
                      <FontAwesome
                        name="exclamation-triangle"
                        size={20}
                        color={selectedOption === index ? "black" : "#a1a1aa"}
                        style={{ marginRight: 12 }}
                      />
                    )}
                    {currentQuestion.question.includes("soreness") && (
                      <FontAwesome
                        name="medkit"
                        size={20}
                        color={selectedOption === index ? "black" : "#a1a1aa"}
                        style={{ marginRight: 12 }}
                      />
                    )}
                    {currentQuestion.question.includes("progress") && (
                      <FontAwesome
                        name="trophy"
                        size={20}
                        color={selectedOption === index ? "black" : "#a1a1aa"}
                        style={{ marginRight: 12 }}
                      />
                    )}
                    {currentQuestion.question.includes("cravings") && (
                      <FontAwesome
                        name="heart"
                        size={20}
                        color={selectedOption === index ? "black" : "#a1a1aa"}
                        style={{ marginRight: 12 }}
                      />
                    )}
                    {currentQuestion.question.includes("hydration") && (
                      <FontAwesome
                        name="tint"
                        size={20}
                        color={selectedOption === index ? "black" : "#a1a1aa"}
                        style={{ marginRight: 12 }}
                      />
                    )} */}
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "500",
                        color: selectedOption === index ? "black" : "white",
                      }}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* Navigation */}
        <View style={{ paddingBottom: 40, paddingHorizontal: 24 }}>
          {selectedOption !== null && (
            <TouchableOpacity
              style={{
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "#322F35",
                minWidth: 100,
                alignItems: "center",
                marginHorizontal: "auto",
                marginBottom: 80,
              }}
              onPress={handleNext}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>
                {currentQuestionIndex === questions.length - 1
                  ? "Finish"
                  : "Next"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
