import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  useTargetQuestions,
  UserInsight,
} from "../../hooks/useTargetQuestions";

interface UserInsightsDisplayProps {
  userId: number;
  daysBack?: number;
}

const UserInsightsDisplay: React.FC<UserInsightsDisplayProps> = ({
  userId,
  daysBack = 30,
}) => {
  const { getUserInsights, loading, error } = useTargetQuestions();
  const [insights, setInsights] = useState<UserInsight[]>([]);

  useEffect(() => {
    loadInsights();
  }, [userId, daysBack]);

  const loadInsights = async () => {
    try {
      const data = await getUserInsights(userId, daysBack);
      setInsights(data);
    } catch (err) {
      console.error("Failed to load insights:", err);
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
      case "fitness":
        return "#C8FE3B";
      case "nutrition":
        return "#4ADE80";
      case "wellness":
        return "#60A5FA";
      case "motivation":
        return "#F472B6";
      default:
        return "#9CA3AF";
    }
  };

  const getProgressColor = (
    avgResponse: number,
    maxValue: number = 5
  ): string => {
    const percentage = avgResponse / maxValue;
    if (percentage >= 0.8) return "#22C55E"; // Green
    if (percentage >= 0.6) return "#EAB308"; // Yellow
    if (percentage >= 0.4) return "#F97316"; // Orange
    return "#EF4444"; // Red
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading insights...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load insights</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadInsights}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (insights.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>
          No insights available yet. Answer some questions to see your progress!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Progress Insights</Text>
      <Text style={styles.subtitle}>Based on the last {daysBack} days</Text>

      {insights.map((insight, index) => (
        <View key={index} style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: getCategoryColor(insight.category) },
              ]}
            >
              <Text style={styles.categoryText}>{insight.category}</Text>
            </View>
            <Text style={styles.questionType}>
              {insight.question_type.toUpperCase()}
            </Text>
          </View>

          <Text style={styles.questionText}>{insight.question_text}</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Average Response</Text>
              <Text
                style={[
                  styles.metricValue,
                  { color: getProgressColor(parseFloat(insight.avg_response)) },
                ]}
              >
                {parseFloat(insight.avg_response).toFixed(1)}/5
              </Text>
            </View>

            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Times Asked</Text>
              <Text style={styles.metricValue}>{insight.response_count}</Text>
            </View>
          </View>

          <Text style={styles.lastResponse}>
            Last answered:{" "}
            {new Date(insight.last_response_date).toLocaleDateString()}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 20,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 16,
    marginBottom: 24,
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: "#C8FE3B",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    alignSelf: "center",
  },
  retryText: {
    color: "black",
    fontWeight: "600",
  },
  insightCard: {
    backgroundColor: "#262626",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: "black",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  questionType: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
  },
  questionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 16,
    lineHeight: 22,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  lastResponse: {
    color: "#6B7280",
    fontSize: 12,
    fontStyle: "italic",
  },
});

export default UserInsightsDisplay;
