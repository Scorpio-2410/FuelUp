// Afternoon Sun Component
// Renders a sun with morning theme settings but afternoon golden colors
// Based on morning SunBloom component with simplified structure
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Rect, LinearGradient as SvgLinear } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const AfternoonSun: React.FC = () => {
  const pulse = useRef(new Animated.Value(1)).current;
  const bloom = useRef(new Animated.Value(1)).current;

  // Disable animation for static sun
  const disableAnimation = true;

  useEffect(() => {
    if (!disableAnimation) {
      Animated.loop(
        Animated.timing(pulse, { toValue: 1.04, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ).start();
      Animated.loop(
        Animated.timing(bloom, { toValue: 1.08, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ).start();
    }
  }, [disableAnimation]);

  // Sun settings matching morning theme
  const size = 90;
  const xPercent = 35; // Move to the right (75% from left)
  const yPercent = 18; // Position at 18% down (higher up for better visibility)
  const cx = (xPercent / 100) * width;
  const cy = (yPercent / 30) * height;

  return (
    <View style={[styles.container, { left: cx - (size * 3.0) * 0.5, top: cy - (size * 3.0) * 0.5 }]} pointerEvents="none">
      {/* Bloom halo - reduced seam blowout */}
      <Animated.View style={{ transform: [{ scale: disableAnimation ? 1 : bloom }], opacity: 0.55 }}>
        <Svg width={size * 3.0} height={size * 3.0}>
          <Defs>
            <RadialGradient id="sunBloom" cx="50%" cy="45%" r="46%">
              <Stop offset="0%" stopColor="#FFEBCB" stopOpacity="0.55" />
              <Stop offset="35%" stopColor="#FFE1B4" stopOpacity="0.34" />
              <Stop offset="70%" stopColor="#FFD79F" stopOpacity="0.16" />
              <Stop offset="100%" stopColor="#FFD090" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#sunBloom)" />
        </Svg>
      </Animated.View>

      {/* Sun core - warm golden center */}
      <Animated.View style={{ position: "absolute", left: (size * 3.0) * 0.5 - size * 0.5, top: (size * 3.0) * 0.5 - size * 0.5, transform: [{ scale: disableAnimation ? 1 : pulse }] }}>
        <Svg width={size} height={size}>
          <Defs>
            {/* Sun core - softer, denser-stop radial with gentle falloff */}
            <RadialGradient id="sunCore" cx="50%" cy="48%" r="56%">
              <Stop offset="0%" stopColor="#FFE8BF" stopOpacity="1.00" />
              <Stop offset="18%" stopColor="#FFE0AB" stopOpacity="0.98" />
              <Stop offset="38%" stopColor="#FFD390" stopOpacity="0.95" />
              <Stop offset="58%" stopColor="#FFC170" stopOpacity="0.82" />
              <Stop offset="78%" stopColor="#FFB160" stopOpacity="0.66" />
              <Stop offset="90%" stopColor="#F9A252" stopOpacity="0.42" />
              <Stop offset="100%" stopColor="#F59A48" stopOpacity="0.20" />
            </RadialGradient>
            {/* Softer warm glare */}
            <SvgLinear id="sunGlare" x1="50%" y1="0%" x2="50%" y2="100%">
              <Stop offset="0%" stopColor="#FFE2AE" stopOpacity="0.18" />
              <Stop offset="100%" stopColor="#FFE2AE" stopOpacity="0" />
            </SvgLinear>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#sunCore)" />
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#sunGlare)" />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 2,
  },
});

export default AfternoonSun;
