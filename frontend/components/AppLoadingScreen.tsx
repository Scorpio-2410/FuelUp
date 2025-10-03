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

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

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
      {/* Background with subtle gradient */}
      <LinearGradient
        colors={['#0a0a0a', '#1a1a1a', '#0a0a0a']}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View style={[styles.content, containerAnimatedStyle]}>
        {/* Logo with pulse animation */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logoGlow}>
            <Image
              source={require('../assets/images/FuelUpIcon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Modern Progress Bar */}
        <View style={styles.progressContainer}>
          {/* Background track */}
          <View style={styles.progressTrack}>
            {/* Animated progress fill */}
            <Animated.View style={[styles.progressFill, { width: `${progress}%` }]}>
              <LinearGradient
                colors={['#8B5CF6', '#6366F1', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
              {/* Shimmer effect */}
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
    backgroundColor: '#0a0a0a',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 60,
  },
  logoGlow: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  logo: {
    width: 140,
    height: 140,
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

