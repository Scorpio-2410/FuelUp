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
import QuestionSlider from "../components/QuestionSlider";

interface Question {
  id: number;
  question: string;
  options: string[];
  isSlider?: boolean;
  sliderConfig?: {
    emojis: string[];
    feedbackTexts: string[];
    minValue?: number;
    maxValue?: number;
  };
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
    sliderConfig: {
      emojis: ["😵", "😰", "😐", "😌"],
      feedbackTexts: [
        "Overwhelmed!",
        "Feeling stressed",
        "Not so bad",
        "Chill",
      ],
      minValue: 1,
      maxValue: 4,
    },
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
    sliderConfig: {
      emojis: ["💤", "🥲", "😄", "⚡️", "🔥"],
      feedbackTexts: [
        "Not up for it today...",
        "So-so",
        "Feeling good!",
        "I'm raring to go!",
        "Let's do this!!",
      ],
      minValue: 1,
      maxValue: 5,
    },
  },
];

export default function QuestionSegment() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [sliderValue, setSliderValue] = useState(3);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    const config = currentQuestion?.sliderConfig;
    const minValue = config?.minValue || 1;
    const optionIndex = value - minValue;
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
        const config = nextQuestion.sliderConfig;
        const minValue = config?.minValue || 1;
        const maxValue = config?.maxValue || 5;
        const defaultValue = Math.floor((minValue + maxValue) / 2);
        setSliderValue(
          (answers[nextQuestion.id] || defaultValue - minValue) + minValue
        );
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
        const config = prevQuestion.sliderConfig;
        const minValue = config?.minValue || 1;
        const maxValue = config?.maxValue || 5;
        const defaultValue = Math.floor((minValue + maxValue) / 2);
        setSliderValue(
          (answers[prevQuestion.id] || defaultValue - minValue) + minValue
        );
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
                <QuestionSlider
                  value={sliderValue}
                  onValueChange={handleSliderChange}
                  emojis={
                    currentQuestion.sliderConfig?.emojis || [
                      "💤",
                      "🥲",
                      "😄",
                      "⚡️",
                      "🔥",
                    ]
                  }
                  feedbackTexts={
                    currentQuestion.sliderConfig?.feedbackTexts || [
                      "Not so good...",
                      "So-so",
                      "I'm good!",
                      "I'm raring to go!",
                      "Let's do this!!!",
                    ]
                  }
                  minValue={currentQuestion.sliderConfig?.minValue || 1}
                  maxValue={currentQuestion.sliderConfig?.maxValue || 5}
                />
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
                    {currentQuestion.question ===
                      "What's our workout for today?" && (
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
                    {currentQuestion.question === "Plans for our meals?" && (
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
