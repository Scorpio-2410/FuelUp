// Simple pull-to-refresh scroll view with animations
// Handles swipe logic and refresh indicators
// Just pass your content and refresh function

import React, { useEffect, useCallback } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  withRepeat,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

interface RefreshScrollProps {
  children: React.ReactNode;
  refreshing: boolean;
  onRefresh: () => void;
  refreshThreshold?: number; // How far to pull before triggering refresh
}

export default function RefreshScroll({
  children,
  refreshing,
  onRefresh,
  refreshThreshold = 130
}: RefreshScrollProps) {
  const insets = useSafeAreaInsets();
  
  // Animation values for pull-to-refresh
  const scrollY = useSharedValue(0);
  const pullDistance = useSharedValue(0);
  const spinRotation = useSharedValue(0);

  // Spinning animation for refresh icon
  useEffect(() => {
    if (refreshing) {
      spinRotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false
      );
    } else {
      spinRotation.value = 0;
    }
  }, [refreshing]);

  // Handle scroll events and detect pull-to-refresh
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;

      if (event.contentOffset.y <= 0) {
        const currentPull = Math.abs(event.contentOffset.y);
        pullDistance.value = currentPull;
        if (currentPull > refreshThreshold && !refreshing) {
          runOnJS(onRefresh)(); // Trigger refresh callback
        }
      } else {
        pullDistance.value = 0;
      }
    },
  });

  // Animated style for the refresh indicator
  const refreshIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      pullDistance.value,
      [0, refreshThreshold * 0.4, refreshThreshold],
      [0, 0.3, 1]
    );
    const translateY = interpolate(
      pullDistance.value,
      [0, refreshThreshold],
      [-50, 0]
    );
    const rotation = refreshing
      ? spinRotation.value
      : interpolate(pullDistance.value, [0, refreshThreshold], [0, 180]);
    
    return {
      opacity,
      transform: [{ translateY }, { rotate: `${rotation}deg` }],
    };
  });

  return (
    <>
      {/* Refresh indicator */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: insets.top + 20,
            left: '50%',
            marginLeft: -15,
            zIndex: 1000,
            width: 30,
            height: 30,
            backgroundColor: '#2a2a2a',
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
          },
          refreshIndicatorStyle,
        ]}>
        {refreshing ? (
          <FontAwesome name="spinner" size={16} color="#bbf246" />
        ) : (
          <FontAwesome name="refresh" size={16} color="#bbf246" />
        )}
      </Animated.View>

      {/* Scrollable content */}
      <AnimatedScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        bounces={true}>
        {children}
      </AnimatedScrollView>
    </>
  );
}
