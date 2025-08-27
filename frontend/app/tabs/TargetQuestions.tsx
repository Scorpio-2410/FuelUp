import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer?: number;
  isSlider?: boolean;
}

const questions: Question[] = [
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
    question: "Rate your energy level today:",
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
      console.log("All questions completed:", answers);
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${
                  ((currentQuestionIndex + 1) / questions.length) * 100
                }%`,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        <View style={styles.optionsContainer}>
          {currentQuestion.isSlider ? (
            <View style={styles.sliderContainer}>
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>1</Text>
                <Text style={styles.sliderLabel}>2</Text>
                <Text style={styles.sliderLabel}>3</Text>
                <Text style={styles.sliderLabel}>4</Text>
                <Text style={styles.sliderLabel}>5</Text>
              </View>
              <TouchableOpacity
                style={styles.sliderTrack}
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
                  style={[
                    styles.sliderFill,
                    { width: `${((sliderValue - 1) / 4) * 100}%` },
                  ]}
                />
                <View
                  style={[
                    styles.sliderThumb,
                    { left: `${((sliderValue - 1) / 4) * 100}%` },
                  ]}
                />
              </TouchableOpacity>
              <Text style={styles.sliderValue}>
                Value: {Math.round(sliderValue)}
              </Text>
            </View>
          ) : (
            currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedOption === index && styles.selectedOption,
                ]}
                onPress={() => handleOptionSelect(index)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedOption === index && styles.selectedOptionText,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      <View style={styles.navigationContainer}>
        {currentQuestionIndex > 0 && (
          <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
        )}

        {selectedOption !== null && (
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex === questions.length - 1
                ? "Finish"
                : "Next"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  progressText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 3,
  },
  questionContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  questionText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedOption: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  selectedOptionText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    minWidth: 100,
    alignItems: "center",
  },
  nextButton: {
    backgroundColor: "#007AFF",
  },
  navButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  nextButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  sliderContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  sliderTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    position: "relative",
    marginBottom: 20,
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 4,
  },
  sliderThumb: {
    position: "absolute",
    top: -6,
    width: 20,
    height: 20,
    backgroundColor: "#007AFF",
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sliderValue: {
    fontSize: 18,
    color: "#007AFF",
    fontWeight: "600",
    marginTop: 10,
  },
});
