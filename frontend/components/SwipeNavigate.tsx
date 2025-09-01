// Simple swipe navigation for tabs
// Handles left/right swipe gestures with configurable sensitivity
// Keeps navigation logic separate from layout concerns

import React from 'react';
import { View } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

interface SwipeNavigateProps {
  children: React.ReactNode;
  currentTabIndex: number;
  totalTabs: number;
  onTabChange: (newIndex: number) => void;
  swipeThreshold?: number; // Distance threshold for swipe detection
  velocityThreshold?: number; // Velocity threshold for quick swipes
  horizontalSensitivity?: number; // How sensitive horizontal swipes are
  verticalTolerance?: number; // How much vertical movement to allow
}

export default function SwipeNavigate({
  children,
  currentTabIndex,
  totalTabs,
  onTabChange,
  swipeThreshold = 60,
  velocityThreshold = 300,
  horizontalSensitivity = 15,
  verticalTolerance = 20
}: SwipeNavigateProps) {

  // Navigate to specific tab index with bounds checking
  const navigateToTab = (index: number) => {
    if (index >= 0 && index < totalTabs && index !== currentTabIndex) {
      onTabChange(index);
    }
  };

  // Swipe gesture configuration with customizable thresholds
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-horizontalSensitivity, horizontalSensitivity]) // Horizontal sensitivity
    .failOffsetY([-verticalTolerance, verticalTolerance]) // Vertical tolerance for scrolling
    .onEnd((event) => {
      'worklet';
      
      const shouldSwipeLeft = event.translationX < -swipeThreshold || event.velocityX < -velocityThreshold;
      const shouldSwipeRight = event.translationX > swipeThreshold || event.velocityX > velocityThreshold;
      
      if (shouldSwipeLeft && currentTabIndex < totalTabs - 1) {
        // Swipe left - go to next tab
        runOnJS(navigateToTab)(currentTabIndex + 1);
      } else if (shouldSwipeRight && currentTabIndex > 0) {
        // Swipe right - go to previous tab  
        runOnJS(navigateToTab)(currentTabIndex - 1);
      }
    });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={swipeGesture}>
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
