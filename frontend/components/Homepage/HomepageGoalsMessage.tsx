// Homepage goal message component with placeholder messages
// Ready for future AI integration to generate personalized goal tracking
// Currently uses random selection from predefined messages

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text } from 'react-native';

interface HomepageGoalsMessageProps {
  className?: string;
  onRefresh?: () => void; // Callback for when message updates
}

const HomepageGoalsMessage = forwardRef<any, HomepageGoalsMessageProps>(({ className, onRefresh }, ref) => {
  const [goalMessage, setGoalMessage] = useState("you r almost there! keep it up");

  // Placeholder goal messages - will be replaced with AI-generated content
  const goals = [
    "you r almost there! keep it up loser",
    "great progress today! loser", 
    "you're on fire! 🔥 loser",
    "crushing your goals! loser",
    "keep the momentum! loser",
    "excellent work! loser",
    "you're unstoppable! loser",
    "amazing effort! loser",
  ];

  // Update message with random selection (placeholder for AI)
  const updateMessage = () => {
    const newMessage = goals[Math.floor(Math.random() * goals.length)];
    setGoalMessage(newMessage);
    onRefresh?.(); // Notify parent component if needed
  };

  // Expose update function for external refresh
  useImperativeHandle(ref, () => ({
    updateMessage
  }));

  return (
    <View
      className={`flex-1 p-4 rounded-2xl ${className}`}
      style={{ backgroundColor: "#bbf246", opacity: 0.7 }}>
      <Text className="text-black text-xl font-bold mb-1">
        Your Goal
      </Text>
      <Text className="text-black text-base font-medium">
        {goalMessage}
      </Text>
    </View>
  );
});

export default HomepageGoalsMessage;
