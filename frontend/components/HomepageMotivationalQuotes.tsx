// Homepage motivational quote component with placeholder quotes
// Ready for future AI integration to generate personalized motivation
// Currently uses random selection from predefined quotes

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, Image } from 'react-native';

interface HomepageMotivationalQuotesProps {
  className?: string;
  onRefresh?: () => void; // Callback for when quote updates
}

const HomepageMotivationalQuotes = forwardRef<any, HomepageMotivationalQuotesProps>(({ className, onRefresh }, ref) => {
  const [quote, setQuote] = useState("give up bro");

  // Placeholder quotes - will be replaced with AI-generated content
  const quotes = [
    "give up bro",
    "you dont got this!",
    "keep crying",
    "stay negative!",
    "almost there! loser",
    "one more step! loser", 
    "never give up! you are a loser!",
  ];

  // Update quote with random selection (placeholder for AI)
  const updateQuote = () => {
    const newQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(newQuote);
    onRefresh?.(); // Notify parent component if needed
  };

  // Expose update function for external refresh
  useImperativeHandle(ref, () => ({
    updateQuote
  }));

  return (
    <View
      className={`p-6 rounded-2xl relative ${className}`}
      style={{ backgroundColor: "#ffd93d", minHeight: 100 }}>
      <View className="pr-16 flex-1 justify-center">
        <Text className="text-black text-2xl font-bold leading-6">
          quote of the day: {quote}
        </Text>
      </View>
      <View className="absolute top-4 right-4 w-20 h-20 rounded-lg overflow-hidden">
        <Image
          source={require("../assets/images/motivational.jpg")}
          className="w-full h-full"
          style={{ resizeMode: "cover" }}
        />
      </View>
    </View>
  );
});

export default HomepageMotivationalQuotes;
