import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { Svg, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const CumulusClouds: React.FC = () => {
  const drift1 = useRef(new Animated.Value(0)).current;
  const drift2 = useRef(new Animated.Value(0)).current;
  const drift3 = useRef(new Animated.Value(0)).current;
  const drift4 = useRef(new Animated.Value(0)).current;
  const drift5 = useRef(new Animated.Value(0)).current;
  const drift6 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slow, gentle drift - clouds move subtly across the screen
    Animated.loop(
      Animated.timing(drift1, {
        toValue: 1,
        duration: 120000, // 2 minutes for subtle drift
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(drift2, {
        toValue: 1,
        duration: 150000, // 2.5 minutes - different speed for parallax
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(drift3, {
        toValue: 1,
        duration: 180000, // 3 minutes - slowest for background effect
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(drift4, {
        toValue: 1,
        duration: 140000, // 2.3 minutes
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(drift5, {
        toValue: 1,
        duration: 160000, // 2.7 minutes
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(drift6, {
        toValue: 1,
        duration: 200000, // 3.3 minutes - very slow
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX1 = drift1.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.2, width * 0.2], // Subtle movement
  });

  const translateX2 = drift2.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.15, width * 0.15], // Even more subtle
  });

  const translateX3 = drift3.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.1, width * 0.1], // Very subtle background drift
  });

  const translateX4 = drift4.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.18, width * 0.18],
  });

  const translateX5 = drift5.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.12, width * 0.12],
  });

  const translateX6 = drift6.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.08, width * 0.08],
  });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Cloud Layer 1 - Top */}
      <Animated.View style={[styles.cloudLayer, { top: 30, opacity: 0.85, transform: [{ translateX: translateX1 }] }]}>
        <Svg height="180" width={width} viewBox={`0 0 ${width} 180`}>
          <Defs>
            <LinearGradient id="cloud1" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <Stop offset="70%" stopColor="#F5F9FF" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#E8F2FF" stopOpacity="0.7" />
            </LinearGradient>
          </Defs>
          {/* Fluffy cumulus cloud */}
          <Path
            d={`M${width * 0.1},120 Q${width * 0.05},80 ${width * 0.15},90 Q${width * 0.18},60 ${width * 0.25},75 Q${width * 0.3},65 ${width * 0.35},80 Q${width * 0.4},70 ${width * 0.42},95 Q${width * 0.45},120 ${width * 0.35},125 Q${width * 0.2},130 ${width * 0.1},120 Z`}
            fill="url(#cloud1)"
          />
        </Svg>
      </Animated.View>

      {/* Cloud Layer 2 - Middle Right */}
      <Animated.View style={[styles.cloudLayer, { top: 80, opacity: 0.8, transform: [{ translateX: translateX2 }] }]}>
        <Svg height="150" width={width} viewBox={`0 0 ${width} 150`}>
          <Defs>
            <LinearGradient id="cloud2" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <Stop offset="80%" stopColor="#F0F8FF" stopOpacity="0.85" />
              <Stop offset="100%" stopColor="#E6F2FF" stopOpacity="0.65" />
            </LinearGradient>
          </Defs>
          <Path
            d={`M${width * 0.55},100 Q${width * 0.52},70 ${width * 0.6},80 Q${width * 0.65},55 ${width * 0.72},70 Q${width * 0.78},65 ${width * 0.82},85 Q${width * 0.85},105 ${width * 0.8},110 Q${width * 0.68},115 ${width * 0.55},100 Z`}
            fill="url(#cloud2)"
          />
        </Svg>
      </Animated.View>

      {/* Cloud Layer 3 - Lower Background */}
      <Animated.View style={[styles.cloudLayer, { top: 140, opacity: 0.6, transform: [{ translateX: translateX3 }] }]}>
        <Svg height="120" width={width} viewBox={`0 0 ${width} 120`}>
          <Defs>
            <LinearGradient id="cloud3" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
              <Stop offset="90%" stopColor="#F0F8FF" stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#E6F2FF" stopOpacity="0.4" />
            </LinearGradient>
          </Defs>
          {/* Smaller distant clouds */}
          <Path
            d={`M${width * 0.25},80 Q${width * 0.22},60 ${width * 0.3},65 Q${width * 0.35},55 ${width * 0.38},70 Q${width * 0.42},80 ${width * 0.35},85 Q${width * 0.28},85 ${width * 0.25},80 Z`}
            fill="url(#cloud3)"
          />
          <Path
            d={`M${width * 0.65},75 Q${width * 0.62},55 ${width * 0.7},60 Q${width * 0.75},50 ${width * 0.78},65 Q${width * 0.82},75 ${width * 0.75},80 Q${width * 0.68},80 ${width * 0.65},75 Z`}
            fill="url(#cloud3)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  cloudLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});

export default CumulusClouds;
