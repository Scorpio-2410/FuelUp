// Simple pull-to-refresh scroll view with animations
// Handles swipe logic and refresh indicators
// Just pass your content and refresh function

import React, { useEffect, useCallback, useRef } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
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
  refreshThreshold = 110
}: RefreshScrollProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values for Facebook-style pull-to-refresh
  const scrollY = useSharedValue(0);
  const pullDistance = useSharedValue(0);
  const spinRotation = useSharedValue(0);
  const isUserTouching = useSharedValue(false);
  const shouldRefreshOnRelease = useSharedValue(false);
  const hasTriggeredHaptic = useSharedValue(false);

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

  // Trigger haptic feedback when refresh threshold is reached
  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback(() => {
    isUserTouching.value = true;
    hasTriggeredHaptic.value = false;
  }, []);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    isUserTouching.value = false;
    
    // Only refresh if user released finger while above threshold
    if (shouldRefreshOnRelease.value && !refreshing) {
      onRefresh();
    }
    
    // Reset all flags
    shouldRefreshOnRelease.value = false;
    hasTriggeredHaptic.value = false;
  }, [onRefresh, refreshing]);

  // Handle scroll events with Facebook-style pull-to-refresh logic
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;

      if (event.contentOffset.y <= 0 && isUserTouching.value) {
        const currentPull = Math.abs(event.contentOffset.y);
        pullDistance.value = currentPull;
        
        // Mark for refresh if threshold reached while pulling
        if (currentPull > refreshThreshold && !refreshing) {
          shouldRefreshOnRelease.value = true;
          
          // Trigger haptic feedback once when threshold is reached
          if (!hasTriggeredHaptic.value) {
            hasTriggeredHaptic.value = true;
            runOnJS(triggerHaptic)();
          }
        }
        
        // Reset refresh flag if user pulls back down below threshold
        if (currentPull < refreshThreshold) {
          shouldRefreshOnRelease.value = false;
          hasTriggeredHaptic.value = false;
        }
      } else {
        pullDistance.value = 0;
        shouldRefreshOnRelease.value = false;
        hasTriggeredHaptic.value = false;
      }
    },
  });

  // Animated style for the sophisticated refresh indicator
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
    
    // Different rotation based on state
    const rotation = refreshing
      ? spinRotation.value
      : shouldRefreshOnRelease.value
        ? 180 // Full rotation when ready to refresh
        : interpolate(pullDistance.value, [0, refreshThreshold], [0, 150]);
    
    // Change background color when ready to refresh
    const backgroundColor = shouldRefreshOnRelease.value ? '#bbf246' : '#2a2a2a';
    
    return {
      opacity,
      backgroundColor,
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

      {/* Scrollable content with touch tracking */}
      <AnimatedScrollView
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        bounces={true}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}>
        {children}
      </AnimatedScrollView>
    </>
  );
}
