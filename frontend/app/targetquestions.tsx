//app/(tabs)/targetquestions.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  TargetQuestionsProvider,
  useTargetQuestionsContext,
} from "../contexts/TargetQuestionsContext";
import DynamicQuestionRenderer from "../components/TargetQuestions/DynamicQuestionRenderer";
import { apiGetMe } from "../constants/api";

function QuestionSegmentContent() {
  const {
    questions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers,
    setAnswer,
    loadQuestionsForUser,
    saveAnswers,
    loading,
    error,
  } = useTargetQuestionsContext();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [sliderValue, setSliderValue] = useState(3);
  const [userId, setUserId] = useState<number | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Get current user and load questions
  useEffect(() => {
    const initializeQuestions = async () => {
      try {
        const { user } = await apiGetMe();
        if (user && user.id) {
          setUserId(user.id);
          const result = await loadQuestionsForUser(user.id);

          // If user has already answered questions for their frequency period, redirect to homepage
          if (result.alreadyAnswered) {
            Alert.alert(
              "Questions Complete! 🎉",
              `You've already answered your questions for ${
                result.timeframe || "today"
              }. Great job staying on track!`,
              [
                {
                  text: "Continue to Dashboard",
                  onPress: () => router.replace("/(tabs)/homepage"),
                },
              ]
            );
            return;
          }
        } else {
          throw new Error("No user ID found");
        }
      } catch (error) {
        console.error("Failed to get current user:", error);
        // Optionally redirect to login or show error
      }
    };

    initializeQuestions();
  }, [loadQuestionsForUser, router]);

  const currentQuestion = questions[currentQuestionIndex];

  // Initialize slider value when component loads or when navigating to slider question
  useEffect(() => {
    if (currentQuestion?.isSlider) {
      const savedValue = answers[currentQuestion.id];
      const config = currentQuestion.sliderConfig;
      const minValue = config?.minValue || 1;
      const maxValue = config?.maxValue || 5;
      const defaultValue = Math.floor((minValue + maxValue) / 2);

      if (savedValue !== undefined) {
        setSliderValue(savedValue + minValue);
        setSelectedOption(savedValue);
      } else {
        setSliderValue(defaultValue);
        setSelectedOption(defaultValue - minValue);
      }
    }
  }, [
    currentQuestionIndex,
    currentQuestion?.isSlider,
    currentQuestion?.id,
    currentQuestion?.sliderConfig,
    answers,
  ]);

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    setAnswer(currentQuestion.id, optionIndex);
  };

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    const config = currentQuestion?.sliderConfig;
    const minValue = config?.minValue || 1;
    const optionIndex = value - minValue;
    setSelectedOption(optionIndex);
    setAnswer(currentQuestion.id, optionIndex);
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      const nextQuestion = questions[currentQuestionIndex + 1];
      setSelectedOption(
        answers[nextQuestion.id] !== undefined ? answers[nextQuestion.id] : null
      );
      if (nextQuestion.isSlider) {
        const config = nextQuestion.sliderConfig;
        const minValue = config?.minValue || 1;
        const maxValue = config?.maxValue || 5;
        const defaultValue = Math.floor((minValue + maxValue) / 2);
        const savedAnswer = answers[nextQuestion.id];
        setSliderValue(
          savedAnswer !== undefined ? savedAnswer + minValue : defaultValue
        );
      }
    } else {
      // All questions completed, save responses and navigate
      if (!userId) {
        Alert.alert("Error", "User not authenticated. Please login again.");
        return;
      }

      try {
        await saveAnswers(userId);
        Alert.alert(
          "Got it! I'll adjust your goals for today and get you started! 😊"
        );
        router.push("/(tabs)/homepage");
      } catch (error) {
        console.error("Failed to save answers:", error);
        Alert.alert(
          "Error",
          "Failed to save your responses. Please try again."
        );
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevQuestion = questions[currentQuestionIndex - 1];
      setSelectedOption(
        answers[prevQuestion.id] !== undefined ? answers[prevQuestion.id] : null
      );
      if (prevQuestion.isSlider) {
        const config = prevQuestion.sliderConfig;
        const minValue = config?.minValue || 1;
        const maxValue = config?.maxValue || 5;
        const defaultValue = Math.floor((minValue + maxValue) / 2);
        const savedAnswer = answers[prevQuestion.id];
        setSliderValue(
          savedAnswer !== undefined ? savedAnswer + minValue : defaultValue
        );
      }
    }
  };

  // Handle loading and error states
  if (loading || questions.length === 0) {
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
          {loading
            ? "Loading your personalized questions..."
            : "Preparing questions..."}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#1a1a1a",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            color: "red",
            fontSize: 18,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Failed to load questions
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 14,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#C8FE3B",
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 12,
          }}
          onPress={() => userId && loadQuestionsForUser(userId)}
        >
          <Text style={{ color: "black", fontWeight: "600" }}>Retry</Text>
        </TouchableOpacity>
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
            {/* Dynamic Question Renderer */}
            <DynamicQuestionRenderer
              question={currentQuestion}
              selectedOption={selectedOption}
              sliderValue={sliderValue}
              onOptionSelect={handleOptionSelect}
              onSliderChange={handleSliderChange}
            />
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

// Main export component with provider
export default function QuestionSegment() {
  return (
    <TargetQuestionsProvider children={<QuestionSegmentContent />} />
  );
}
