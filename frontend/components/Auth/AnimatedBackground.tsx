import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence, interpolate, Easing } from 'react-native-reanimated';

interface AnimatedBackgroundProps {
  stage?: 'landing' | 'form';
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ stage = 'landing' }) => {
  // Shared value to track stage position for container animation
  const stagePosition = useSharedValue(0);

  // Animate container position when stage changes
  useEffect(() => {
    const targetValue = stage === 'form' ? 1 : 0;
    stagePosition.value = withTiming(
      targetValue, 
      { duration: 800, easing: Easing.out(Easing.cubic) }
    );
  }, [stage, stagePosition]);

  // Container animation style - translates entire background diagonally with scaling
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(stagePosition.value, [0, 1], [0, -200]) },
      { translateY: interpolate(stagePosition.value, [0, 1], [0, -150]) },
      { scale: interpolate(stagePosition.value, [0, 1], [1, 1.3]) }
    ]
  }));

  // Orb 1 - green orb moves diagonally from top-left to sign-in form
  const orb1Animation = useAnimatedStyle(() => ({
    transform: [
      { translateY: withRepeat(withSequence(
        withTiming(-20, { duration: 3000 }),
        withTiming(20, { duration: 3000 })
      ), -1, true) },
      { translateX: withRepeat(withTiming(15, { duration: 4000 }), -1, true) },
      // Diagonal movement from landing to sign-in form
      { translateX: interpolate(stagePosition.value, [0, 1], [0, 150]) },
      { translateY: interpolate(stagePosition.value, [0, 1], [0, 480]) },
      // Scale down 30% in sign-in form
      { scale: interpolate(stagePosition.value, [0, 1], [1, 0.7]) }
    ]
  }));

  // Orb 2 - moves from center-right to right side for sign-in form - blue orb
  const orb2Animation = useAnimatedStyle(() => ({
    transform: [
      { translateY: withRepeat(withSequence(
        withTiming(25, { duration: 4000 }),
        withTiming(-25, { duration: 4000 })
      ), -1, true) },
      { translateX: withRepeat(withTiming(-20, { duration: 5000 }), -1, true) },
      // Stage-based positioning - moves to right side
      { translateX: interpolate(stagePosition.value, [0, 1], [0, 200]) },
      { translateY: interpolate(stagePosition.value, [0, 1], [0, -50]) },
      // Scale down 30% in sign-in form
      { scale: interpolate(stagePosition.value, [0, 1], [1, 0.7]) }
    ]
  }));

  // Orb 3 - moves from bottom-left to top-center for sign-in form - purple orb
  const orb3Animation = useAnimatedStyle(() => ({
    transform: [
      { translateY: withRepeat(withSequence(
        withTiming(-30, { duration: 5000 }),
        withTiming(30, { duration: 5000 })
      ), -1, true) },
      { translateX: withRepeat(withTiming(25, { duration: 6000 }), -1, true) },
      // Stage-based positioning
      { translateX: interpolate(stagePosition.value, [0, 1], [0, -50]) },
      { translateY: interpolate(stagePosition.value, [0, 1], [0, -80]) },
      // Scale down 30% in sign-in form
      { scale: interpolate(stagePosition.value, [0, 1], [1, 0.7]) }
    ]
  }));

  // Orb 4 - orange orb visible in both landing and sign-in form
  const orb4Animation = useAnimatedStyle(() => ({
    opacity: interpolate(stagePosition.value, [0, 1], [1, 1]),
    transform: [
      { translateY: withRepeat(withSequence(
        withTiming(-15, { duration: 3500 }),
        withTiming(15, { duration: 3500 })
      ), -1, true) },
      { translateX: withRepeat(withTiming(-10, { duration: 4500 }), -1, true) },
      // Stage-based positioning - moves to right side (old position)
      { translateX: interpolate(stagePosition.value, [0, 1], [0, 50]) },
      { translateY: interpolate(stagePosition.value, [0, 1], [0, 10]) },
      // Scale down 30% in sign-in form
      { scale: interpolate(stagePosition.value, [0, 1], [1, 0.7]) }
    ]
  }));

  // Orb 5 - center orb for sign-in form coverage - pink orb
  const orb5Animation = useAnimatedStyle(() => ({
    opacity: interpolate(stagePosition.value, [0, 1], [0, 0.8]),
    transform: [
      { translateY: withRepeat(withSequence(
        withTiming(-25, { duration: 4000 }),
        withTiming(25, { duration: 4000 })
      ), -1, true) },
      { translateX: withRepeat(withTiming(20, { duration: 5000 }), -1, true) },
      // Stage-based positioning - stays in center
      { translateX: interpolate(stagePosition.value, [0, 1], [0, -80]) },
      { translateY: interpolate(stagePosition.value, [0, 1], [0, -30]) },
      // Scale down 30% in sign-in form
      { scale: interpolate(stagePosition.value, [0, 1], [1, 0.7]) }
    ]
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, containerStyle]}>
      {/* Dark gradient base - extended beyond screen bounds */}
      <LinearGradient
        colors={['#0A0A0A', '#1a1a1a', '#0f0f0f']}
        style={{
          position: 'absolute',
          top: -200,
          left: -200,
          right: -200,
          bottom: -200,
        }}
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
      
      <Animated.View style={[styles.orb, styles.orb4, orb4Animation]}>
        <LinearGradient
          colors={['rgba(245, 158, 11, 0.3)', 'rgba(245, 158, 11, 0.1)']}
          style={styles.orbGradient}
        />
      </Animated.View>
      
      <Animated.View style={[styles.orb, styles.orb5, orb5Animation]}>
        <LinearGradient
          colors={['rgba(236, 72, 153, 0.3)', 'rgba(236, 72, 153, 0.1)']}
          style={styles.orbGradient}
        />
      </Animated.View>
      
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  orb: { // base orb
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: { // green
    width: 450,
    height: 450,
    top: '-20%',
    left: '-40%',
  },
  orb2: { // blue
    width: 450,
    height: 450,
    top: '20%',
    right: '-35%',
  },
  orb3: { // purple
    width: 400,
    height: 400,
    bottom: '-20%',
    left: '-10%',
  },
  orb4: { // orange
    width: 400,
    height: 400,
    top: '70%',
    left: '60%',
  },
  orb5: { // pink
    width: 380,
    height: 380,
    top: '10%',
    left: '20%',
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
});

export default AnimatedBackground;