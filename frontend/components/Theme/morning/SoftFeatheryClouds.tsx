import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { Svg, Path, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

const SoftFeatheryClouds: React.FC = () => {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slow, gentle drift for background haze
    Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: 90000, // 90 seconds for a full loop
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width], // Move across the screen
  });

  return (
    <Animated.View style={{ transform: [{ translateX }] }}>
      <Svg height="300" width={width * 2} style={{ opacity: 0.6 }}>
        <Defs>
          <RadialGradient id="hazeFill" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.7)" />
            <Stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </RadialGradient>
        </Defs>
        <Path
          d="M-20,150 Q0,130 25,140 T75,145 Q100,135 125,150 T175,155 Q200,145 225,160 T275,165 Q300,155 325,170 T375,175 L550,180"
          fill="url(#hazeFill)"
        />
      </Svg>
    </Animated.View>
  );
};

export default SoftFeatheryClouds;
