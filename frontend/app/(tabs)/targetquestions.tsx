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

interface Question {
  id: number;
  question: string;
  options: string[];
  isSlider?: boolean;
}

const questions: Question[] = [
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
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const currentQuestion = questions[currentQuestionIndex];

  // Initialize slider value when component loads or when navigating to slider question
  useEffect(() => {
    if (currentQuestion.isSlider) {
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
    currentQuestion.isSlider,
    currentQuestion.id,
    answers,
  ]);

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    const optionIndex = Math.round(value) - 1; // Convert 1-5 to 0-4 index
    setSelectedOption(optionIndex);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

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
      // You can navigate to another page here
      // router.push('/results');
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
                  <TouchableOpacity
                    style={{
                      width: "100%",
                      height: 8,
                      backgroundColor: "#3f3f46",
                      borderRadius: 4,
                      marginBottom: 24,
                      position: "relative",
                    }}
                    onPress={(event) => {
                      const { locationX } = event.nativeEvent;
                      const trackWidth = 300; // Approximate width, you can make this dynamic
                      const percentage = locationX / trackWidth;
                      const newValue = Math.max(
                        1,
                        Math.min(5, Math.round(percentage * 5))
                      );
                      handleSliderChange(newValue);
                    }}
                    activeOpacity={1}
                  >
                    <View
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: "100%",
                        backgroundColor: "#C8FE3B",
                        borderRadius: 4,
                        width: `${((sliderValue - 1) / 4) * 100}%`,
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        width: 20,
                        height: 20,
                        backgroundColor: "#FFE53B",
                        borderRadius: 10,
                        borderWidth: 3,
                        borderColor: "white",
                        left: `${((sliderValue - 1) / 4) * 100}%`,
                        marginLeft: -10,
                        marginTop: -6,
                      }}
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
                  </TouchableOpacity>
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
        <View style={{ paddingBottom: 24, paddingHorizontal: 24 }}>
          {selectedOption !== null && (
            <TouchableOpacity
              style={{
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "#322F35",
                minWidth: 100,
                alignItems: "center",
                marginHorizontal: "auto",
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
