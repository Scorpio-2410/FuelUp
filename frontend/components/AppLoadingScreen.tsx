import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function AppLoadingScreen() {
  const [progress, setProgress] = useState(0);
  
  // Pulse animation for logo
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fade in animation
    opacity.value = withTiming(1, { duration: 600 });
    
    // Subtle pulse animation for logo
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Simulate loading progress - 7 seconds total
    const totalDuration = 7000; // 7 seconds
    const intervalTime = 50; // Update every 50ms
    const incrementPerStep = (100 / totalDuration) * intervalTime;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(prev + incrementPerStep, 100);
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Charcoal Gradient Background - Luxury Metallic */}
      <LinearGradient
        colors={['#1C1C1C', '#2A2A2A', '#3A3A3A']}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View style={[styles.content, containerAnimatedStyle]}>
        {/* Logo with pulse animation */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require('../assets/images/NewFuelUpIcon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Modern Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: `${progress}%` }]}>
              <LinearGradient
                colors={['#8B5CF6', '#6366F1', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmer}
              />
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 60,
  },
  logo: {
    width: 180,
    height: 180,
    backgroundColor: 'transparent',
  },
  progressContainer: {
    width: '100%',
    maxWidth: 280,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  progressGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
});

