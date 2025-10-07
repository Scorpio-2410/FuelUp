import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { Svg, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

const CumulusClouds: React.FC = () => {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Faster drift for foreground clouds to create parallax
    Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: 45000, // 45 seconds for a full loop
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 1.5, width * 1.5],
  });

  return (
    <Animated.View style={{ position: 'absolute', top: 50, opacity: 0.7, transform: [{ translateX }] }}>
      <Svg height="250" width={width * 2}>
        <Defs>
          <LinearGradient id="cumulusFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="80%" stopColor="#F0F8FF" />
            <Stop offset="100%" stopColor="#E6F2FF" />
          </LinearGradient>
        </Defs>
        {/* Main cloud mass */}
        <Path
          d="M50,150 C-20,150 0,70 60,80 C70,40 130,40 140,80 C200,70 220,150 150,150 Z"
          fill="url(#cumulusFill)"
        />
        {/* Smaller cloud */}
        <Path
          d="M250,140 C200,140 210,100 260,110 C270,90 310,90 320,110 C370,100 380,140 320,140 Z"
          fill="url(#cumulusFill)"
          transform="translate(20, 20) scale(0.8)"
        />
      </Svg>
    </Animated.View>
  );
};

export default CumulusClouds;
