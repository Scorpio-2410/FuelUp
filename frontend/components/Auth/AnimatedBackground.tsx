import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

const AnimatedBackground = () => {
  // Multiple floating orbs with different animations
  const orb1Animation = useAnimatedStyle(() => ({
    transform: [
      { translateY: withRepeat(withSequence(
        withTiming(-20, { duration: 3000 }),
        withTiming(20, { duration: 3000 })
      ), -1, true) },
      { translateX: withRepeat(withTiming(15, { duration: 4000 }), -1, true) }
    ]
  }));

  const orb2Animation = useAnimatedStyle(() => ({
    transform: [
      { translateY: withRepeat(withSequence(
        withTiming(25, { duration: 4000 }),
        withTiming(-25, { duration: 4000 })
      ), -1, true) },
      { translateX: withRepeat(withTiming(-20, { duration: 5000 }), -1, true) }
    ]
  }));

  const orb3Animation = useAnimatedStyle(() => ({
    transform: [
      { translateY: withRepeat(withSequence(
        withTiming(-30, { duration: 5000 }),
        withTiming(30, { duration: 5000 })
      ), -1, true) },
      { translateX: withRepeat(withTiming(25, { duration: 6000 }), -1, true) }
    ]
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Dark gradient base */}
      <LinearGradient
        colors={['#0A0A0A', '#1a1a1a', '#0f0f0f']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Floating 3D orbs */}
      <Animated.View style={[styles.orb, styles.orb1, orb1Animation]}>
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.1)']}
          style={styles.orbGradient}
        />
      </Animated.View>
      
      <Animated.View style={[styles.orb, styles.orb2, orb2Animation]}>
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.1)']}
          style={styles.orbGradient}
        />
      </Animated.View>
      
      <Animated.View style={[styles.orb, styles.orb3, orb3Animation]}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.1)']}
          style={styles.orbGradient}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    width: 300,
    height: 300,
    top: '10%',
    left: '-20%',
  },
  orb2: {
    width: 250,
    height: 250,
    top: '50%',
    right: '-15%',
  },
  orb3: {
    width: 200,
    height: 200,
    bottom: '15%',
    left: '10%',
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
});

export default AnimatedBackground;