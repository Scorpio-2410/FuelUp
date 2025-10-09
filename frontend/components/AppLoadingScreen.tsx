// Displays a loading screen with a progress bar and a logo
import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import AppPreloader, { PreloadProgress } from '../services/AppPreloader';

export default function AppLoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Getting ready...');
  
  // Pulse animation for logo
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  // Shine animation for progress bar
  const shineTranslateX = useSharedValue(-100);

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

    // Continuous shine animation for progress bar
    shineTranslateX.value = withRepeat(
      withTiming(400, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );

    // Set up progress callback to receive updates from _layout.tsx
    const preloader = AppPreloader.getInstance();
    
    // Set up progress callback
    preloader.setProgressCallback((progressData: PreloadProgress) => {
      setProgress(progressData.progress);
      setLoadingMessage(progressData.message);
    });
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const shineAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shineTranslateX.value }],
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

        {/* Loading Message */}
        <Text style={styles.loadingMessage}>{loadingMessage}</Text>

        {/* Enhanced Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: `${progress}%` }]}>
              <LinearGradient
                colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
              {/* Animated shine effect */}
              <Animated.View style={[styles.shineEffect, shineAnimatedStyle]} />
            </Animated.View>
          </View>
          {/* Progress percentage */}
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
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
    marginBottom: 40,
  },
  loadingMessage: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  logo: {
    width: 180,
    height: 180,
    backgroundColor: 'transparent',
  },
  progressContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
  progressFill: {
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  progressGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-20deg' }],
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    letterSpacing: 0.5,
  },
});

