import React, { useCallback } from 'react';
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
  children?: React.ReactNode;
  refreshing: boolean;
  onRefresh: () => void;
  refreshThreshold?: number;
}

export default function RefreshScroll({
  children,
  refreshing,
  onRefresh,
  refreshThreshold = 110,
}: RefreshScrollProps) {
  const insets = useSafeAreaInsets();
  
  const pullDistance = useSharedValue(0);
  const spinRotation = useSharedValue(0);
  const shouldRefreshOnRelease = useSharedValue(false);
  const hasTriggeredHaptic = useSharedValue(false);

  // Spinning animation for refresh icon
  React.useEffect(() => {
    if (refreshing) {
      spinRotation.value = withRepeat(withTiming(360, { duration: 1000 }), -1, false);
    } else {
      spinRotation.value = withTiming(0);
    }
  }, [refreshing]);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const scrollHandler = useAnimatedScrollHandler(
    {
      onBeginDrag: () => {
        hasTriggeredHaptic.value = false;
      },
      onScroll: (event: any) => {
        const scrollY = event.contentOffset.y;
        if (scrollY <= 0) {
          pullDistance.value = Math.abs(scrollY);

          if (pullDistance.value > refreshThreshold && !refreshing) {
            shouldRefreshOnRelease.value = true;
            if (!hasTriggeredHaptic.value) {
              hasTriggeredHaptic.value = true;
              runOnJS(triggerHaptic)();
            }
          } else {
            shouldRefreshOnRelease.value = false;
          }
        }
      },
      onEndDrag: () => {
        if (shouldRefreshOnRelease.value && !refreshing) {
          runOnJS(onRefresh)();
        }
        shouldRefreshOnRelease.value = false;
        hasTriggeredHaptic.value = false;
      },
    }
  );

  const refreshIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      pullDistance.value,
      [0, refreshThreshold * 0.7, refreshThreshold],
      [0, 0.5, 1]
    );
    const rotation = refreshing
      ? spinRotation.value
      : interpolate(pullDistance.value, [0, refreshThreshold], [0, 180]);

    const backgroundColor = shouldRefreshOnRelease.value ? '#bbf246' : '#2a2a2a';
    
    return {
      opacity,
      backgroundColor,
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const iconColorStyle = useAnimatedStyle(() => {
    return {
      color: shouldRefreshOnRelease.value ? '#000' : '#FFF',
    };
  });

  return (
    <>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: insets.top + 20,
            alignSelf: 'center',
            zIndex: 1000,
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
          },
          refreshIndicatorStyle,
        ]}>
        <Animated.Text style={iconColorStyle}>
          <FontAwesome name={refreshing ? "spinner" : "arrow-down"} size={16} />
        </Animated.Text>
      </Animated.View>

      <AnimatedScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        bounces
      >
        {children}
      </AnimatedScrollView>
    </>
  );
}
