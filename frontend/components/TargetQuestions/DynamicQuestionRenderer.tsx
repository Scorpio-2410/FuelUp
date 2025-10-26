import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import QuestionSlider from "./QuestionSlider";
import { TargetQuestion } from "../../hooks/useTargetQuestions";

interface DynamicQuestionRendererProps {
  question: TargetQuestion;
  selectedOption: number | null;
  sliderValue: number;
  onOptionSelect: (optionIndex: number) => void;
  onSliderChange: (value: number) => void;
}

const DynamicQuestionRenderer: React.FC<DynamicQuestionRendererProps> = ({
  question,
  selectedOption,
  sliderValue,
  onOptionSelect,
  onSliderChange,
}) => {
  const getIconForOption = (questionText: string, option: string): string => {
    const optionLower = option.toLowerCase();
    const questionLower = questionText.toLowerCase();

    // Exact option matches first (most specific)
    const exactMatches: { [key: string]: string } = {
      // Workout types
      strength: "flash",
      cardio: "heartbeat",
      recovery: "bed",
      "sorry, not today": "times-circle",

      // Meal planning
      "low-carb": "leaf",
      "high protein": "plus-square",
      balanced: "balance-scale",
      "eating out": "cutlery",
      "something different": "question-circle",

      // Exercise duration
      "less than 30 minutes": "clock-o",
      "30-60 minutes": "clock-o",
      "60-90 minutes": "clock-o",
      "more than 90 minutes": "clock-o",

      // Sleep quality
      poorly: "frown-o",
      "not bad": "meh-o",
      well: "smile-o",
      "excellent!": "star",

      // Progress feelings
      slow: "turtle",
      "just right": "check-circle",
      fast: "rocket",
      "amazing!": "star",

      // Food cravings
      sweets: "birthday-cake",
      savoury: "cutlery",
      none: "ban",

      // Hydration
      low: "tint",
      high: "tint",

      // Fitness goals
      "strength building": "dumbbell",
      "weight loss": "arrow-down",
      endurance: "clock-o",
      flexibility: "expand",

      // Workout days achieved
      "0-1 days": "calendar-o",
      "2-3 days": "calendar-o",
      "4-5 days": "calendar-o",
      "6-7 days": "calendar",

      // Nutrition aspects
      "portion control": "utensils",
      "protein intake": "plus-square",
      "vegetable intake": "leaf",
      hydration: "tint",
      "meal timing": "clock",

      // Routine changes
      "more cardio": "heartbeat",
      "more strength training": "dumbbell",
      "better nutrition": "apple",
      "more rest": "bed",
      "new activities": "plus-circle",

      // Fitness activities
      yoga: "child",
      swimming: "tint",
      "rock climbing": "mountain",
      dancing: "music",
      "martial arts": "hand-rock-o",

      // Energy/motivation levels
      "not up for it today...": "circle-o",
      "so-so": "circle-o",
      "feeling good!": "circle",
      "i'm raring to go!": "circle",
      "let's do this!!": "star",

      // Rewards
      "new workout gear": "shopping-bag",
      "cheat meal": "cutlery",
      "rest day": "bed",
      "new activity": "star",
      "achievement badge": "trophy",

      // Workout intensity
      light: "feather",
      moderate: "adjust",
      intense: "fire",
      "maximum effort": "bolt",

      // Sleep hours
      "less than 6": "moon",
      "6-7 hours": "moon",
      "7-8 hours": "moon",
      "more than 8": "bed",
    };

    // Check for exact matches first
    if (exactMatches[optionLower]) {
      return exactMatches[optionLower];
    }

    // Pattern-based matching for common words
    if (optionLower.includes("yes")) return "check";
    if (optionLower.includes("no")) return "times";
    if (optionLower.includes("high")) return "arrow-up";
    if (optionLower.includes("low")) return "arrow-down";
    if (optionLower.includes("more")) return "plus";
    if (optionLower.includes("less")) return "minus";
    if (optionLower.includes("better")) return "thumbs-up";
    if (optionLower.includes("new")) return "plus-circle";

    // Question context-based fallbacks
    if (
      questionLower.includes("workout") ||
      questionLower.includes("exercise")
    ) {
      return "dumbbell";
    }
    if (questionLower.includes("meal") || questionLower.includes("nutrition")) {
      return "utensils";
    }
    if (questionLower.includes("energy") || questionLower.includes("stress")) {
      return "bolt";
    }
    if (questionLower.includes("sleep")) {
      return "moon";
    }
    if (
      questionLower.includes("progress") ||
      questionLower.includes("satisfied")
    ) {
      return "bar-chart";
    }
    if (questionLower.includes("hydration")) {
      return "tint";
    }
    if (questionLower.includes("soreness")) {
      return "band-aid";
    }
    if (questionLower.includes("motivated")) {
      return "fire";
    }

    // Default fallback
    return "circle";
  };

  return (
    <View>
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
        {question.text}
      </Text>

      <View style={{ gap: 16, marginTop: 40 }}>
        {question.isSlider ? (
          <QuestionSlider
            value={sliderValue}
            onValueChange={onSliderChange}
            emojis={
              question.sliderConfig?.emojis || ["😐", "🙂", "😊", "😄", "🎉"]
            }
            feedbackTexts={
              question.sliderConfig?.feedbackTexts || [
                "Not so good",
                "Could be better",
                "Okay",
                "Good",
                "Excellent!",
              ]
            }
            minValue={question.sliderConfig?.minValue || 1}
            maxValue={question.sliderConfig?.maxValue || 5}
          />
        ) : (
          question.options.map((option, index) => {
            const icon = getIconForOption(question.text, option);
            const isSelected = selectedOption === index;

            return (
              <TouchableOpacity
                key={index}
                style={{
                  padding: 20,
                  borderRadius: 12,
                  borderWidth: 2,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  borderColor: isSelected ? "black" : "#3f3f46",
                  backgroundColor: isSelected ? "#C8FE3B" : "#262626",
                }}
                onPress={() => onOptionSelect(index)}
              >
                <FontAwesome
                  name={icon as any}
                  size={20}
                  color={isSelected ? "black" : "#a1a1aa"}
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: isSelected ? "black" : "white",
                  }}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Question metadata for debugging/admin (only show in development)
      {__DEV__ && (
        <View
          style={{
            marginTop: 20,
            padding: 10,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#888", fontSize: 12 }}>
            Priority: {question.priority} | Frequency: {question.frequency} |
            Category: {question.category} | Weight: {question.influenceWeight}
          </Text>
        </View>
      )} */}
    </View>
  );
};

export default DynamicQuestionRenderer;
