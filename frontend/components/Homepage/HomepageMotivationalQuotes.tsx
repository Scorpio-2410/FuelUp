// Homepage motivational quote component with placeholder quotes
// Ready for future AI integration to generate personalized motivation
// Currently uses random selection from predefined quotes

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
    <View className={`rounded-3xl overflow-hidden ${className}`}
      style={{ 
        shadowColor: '#f59e0b',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 14,
      }}>
      {/* Main gradient background */}
      <LinearGradient
        colors={['#1e1b4b', '#312e81', '#1e293b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="relative"
        style={{ minHeight: 160 }}>
        
        {/* Subtle overlay for depth */}
        <LinearGradient
          colors={['rgba(251, 191, 36, 0.08)', 'transparent', 'rgba(168, 85, 247, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        
        {/* Decorative background elements */}
        <View className="absolute -top-8 -right-8 opacity-8">
          <Ionicons name="sparkles" size={120} color="#fbbf24" />
        </View>
        <View className="absolute -bottom-6 -left-6 opacity-6">
          <Ionicons name="book-outline" size={90} color="#a78bfa" />
        </View>
        
        {/* Top accent bar with golden gradient */}
        <LinearGradient
          colors={['#f59e0b', '#fbbf24', '#fcd34d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="absolute top-0 left-0 right-0"
          style={{ height: 2 }}
        />

        {/* Content wrapper */}
        <View className="p-7" style={{ overflow: 'visible' }}>
          {/* Quote text with sophisticated styling */}
          <View className="relative" style={{ minHeight: 120 }}>
            {/* Opening quote mark */}
            <Text 
              className="text-amber-400 font-black absolute top-0 left-0"
              style={{ 
                fontSize: 72,
                lineHeight: 72,
                opacity: 0.85,
                fontWeight: '900',
              }}>
              "
            </Text>
            
            <View className="pl-14 pr-14 pt-8 pb-8">
              <Text 
                className="text-white text-lg font-medium leading-7" 
                style={{ 
                  letterSpacing: 0.4, 
                  lineHeight: 28,
                  fontStyle: 'italic',
                }}>
                {quote}
              </Text>
            </View>
            
            {/* Closing quote mark */}
            <Text 
              className="text-amber-400 font-black absolute right-0"
              style={{ 
                fontSize: 72,
                lineHeight: 72,
                opacity: 0.85,
                fontWeight: '900',
                bottom: -30,
              }}>
              "
            </Text>
          </View>
        </View>

        {/* Bottom accent shimmer */}
        <LinearGradient
          colors={['transparent', 'rgba(251, 191, 36, 0.15)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0"
          style={{ height: 1 }}
        />
      </LinearGradient>
    </View>
  );
});

export default HomepageMotivationalQuotes;
