// Morning Theme Cloud Layer Component
// Creates wispy cirrus/cirrostratus clouds with procedural noise
import React, { useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface CloudLayerProps {
  isMorningTime: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

export const CloudLayer: React.FC<CloudLayerProps> = ({
  isMorningTime,
  intensity = 'medium'
}) => {
  const drift = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Intensity-based settings
  const getIntensitySettings = () => {
    switch (intensity) {
      case 'low': return { opacity: 0.25, speed: 0.3 };
      case 'medium': return { opacity: 0.4, speed: 0.5 };
      case 'high': return { opacity: 0.55, speed: 0.7 };
      default: return { opacity: 0.4, speed: 0.5 };
    }
  };

  useEffect(() => {
    if (!isMorningTime) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start();
      return;
    }

    // Fade in clouds
    Animated.timing(opacity, {
      toValue: getIntensitySettings().opacity,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    // Continuous drift animation
    Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: 60000 / getIntensitySettings().speed, // Slower for more realistic drift
        useNativeDriver: true,
      })
    ).start();
  }, [isMorningTime, intensity]);

  if (!isMorningTime) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.cloudContainer,
        {
          opacity,
          transform: [
            {
              translateX: drift.interpolate({
                inputRange: [0, 1],
                outputRange: [0, width * 0.1], // Gentle drift
              }),
            },
          ],
        },
      ]}
    >
      {/* Base stratus layer - broad, soft clouds */}
      <View style={styles.baseCloud}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0)']}
          style={styles.cloudGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Wispy filaments layer */}
      <Animated.View
        style={[
          styles.wispyCloud,
          {
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -width * 0.05], // Slight counter-drift for depth
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0)']}
          style={styles.cloudGradient}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
        />
      </Animated.View>

      {/* High altitude wisps */}
      <Animated.View
        style={[
          styles.highWisps,
          {
            transform: [
              {
                translateX: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, width * 0.08],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0)']}
          style={styles.cloudGradient}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cloudContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 1.2, // Slightly wider for seamless drift
    height: height * 0.6, // Cover upper portion of screen
    zIndex: 2,
  },
  baseCloud: {
    position: 'absolute',
    top: height * 0.05,
    left: -width * 0.1,
    width: width * 1.3,
    height: height * 0.3,
    borderRadius: 200,
    transform: [{ skewX: -5 }, { skewY: 2 }], // Wind direction
  },
  wispyCloud: {
    position: 'absolute',
    top: height * 0.1,
    left: -width * 0.05,
    width: width * 1.1,
    height: height * 0.25,
    borderRadius: 150,
    transform: [{ skewX: -8 }, { skewY: 3 }],
  },
  highWisps: {
    position: 'absolute',
    top: height * 0.02,
    left: -width * 0.08,
    width: width * 1.15,
    height: height * 0.2,
    borderRadius: 100,
    transform: [{ skewX: -3 }, { skewY: 1 }],
  },
  cloudGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 200,
  },
});

export default CloudLayer;
