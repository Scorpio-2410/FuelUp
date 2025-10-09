// Horizon Sun Component
// Renders a half-visible sun at the horizon with warm glow effects
// Positioned at bottom center with wide elliptical bloom
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Ellipse } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const HorizonSun: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Subtle pulsing animation for sun glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Sun positioned at 80% of screen height, moved up 80px total (40px + 40px more)
  const sunY = height * 0.80 - 80;
  const sunX = width / 2;
  const sunRadius = Math.min(width, height) * 0.14; // ~14% of smaller dimension

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={width} height={height} style={styles.svg}>
        <Defs>
          {/* Sun disc gradient */}
          <RadialGradient id="sunDisc" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0%" stopColor="#FFF8E6" stopOpacity="1" />
            <Stop offset="90%" stopColor="#FFE39E" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FFE39E" stopOpacity="0.95" />
          </RadialGradient>

          {/* Tight glow around sun */}
          <RadialGradient id="tightGlow" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0%" stopColor="rgba(255,228,160,0.45)" stopOpacity="1" />
            <Stop offset="70%" stopColor="rgba(255,228,160,0.25)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(255,228,160,0)" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Wide horizon bloom (elliptical, angled slightly upward) */}
        <Ellipse
          cx={sunX}
          cy={sunY + 5}
          rx={width * 0.62}
          ry={sunRadius * 2.2}
          fill="rgba(255,210,120,0.18)"
          transform={`rotate(-2 ${sunX} ${sunY})`}
        />

        {/* Tight glow layer */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Svg width={width} height={height}>
            <Circle
              cx={sunX}
              cy={sunY}
              r={sunRadius * 1.3}
              fill="url(#tightGlow)"
            />
          </Svg>
        </Animated.View>

        {/* Sun disc (50-60% visible, clipped at horizon) */}
        <Circle
          cx={sunX}
          cy={sunY}
          r={sunRadius}
          fill="url(#sunDisc)"
        />
        
        {/* Clip mask to show only 50-60% of sun */}
        <View style={[styles.sunClip, { 
          top: sunY - sunRadius * 0.2, // Show 60% of sun (40% clipped)
          left: sunX - sunRadius,
          width: sunRadius * 2,
          height: sunRadius * 1.2 // Only show upper 60%
        }]} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  sunClip: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderTopLeftRadius: 1000,
    borderTopRightRadius: 1000,
    overflow: 'hidden',
  },
});

export default HorizonSun;

