// Beach Sunset Component
// Creates water reflection effect below the sun with smooth blending
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Circle, Ellipse } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const BeachSunset: React.FC = () => {
  // Sun position (matches HorizonSun component)
  const sunY = height * 0.80 - 80;
  const sunX = width / 2;
  const sunRadius = Math.min(width, height) * 0.14;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Water reflection layer below sun */}
      <LinearGradient
        colors={[
          'rgba(255, 228, 160, 0.3)',  // Light reflection near sun
          'rgba(255, 210, 120, 0.2)',  // Medium reflection
          'rgba(255, 190, 90, 0.15)',  // Fading reflection
          'rgba(255, 170, 70, 0.1)',   // Subtle reflection
          'rgba(255, 150, 50, 0.05)',  // Very subtle
          'transparent',                // Complete fade
        ]}
        locations={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
        style={[styles.waterReflection, { top: sunY + sunRadius * 0.4 }]}
      />

      {/* Sun reflection in water */}
      <Svg width={width} height={height} style={styles.svg}>
        <Defs>
          {/* Water reflection gradient */}
          <RadialGradient id="waterReflection" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0%" stopColor="rgba(255, 248, 230, 0.4)" stopOpacity="1" />
            <Stop offset="50%" stopColor="rgba(255, 228, 160, 0.25)" stopOpacity="1" />
            <Stop offset="80%" stopColor="rgba(255, 210, 120, 0.15)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(255, 190, 90, 0)" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Elliptical sun reflection */}
        <Ellipse
          cx={sunX}
          cy={sunY + sunRadius * 2.2} // Position below sun
          rx={sunRadius * 1.1}
          ry={sunRadius * 0.6} // Flattened for water reflection
          fill="url(#waterReflection)"
        />
      </Svg>

      {/* Water shimmer effect */}
      <View style={[styles.waterShimmer, { top: sunY + sunRadius * 2.5 }]} />
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
    zIndex: 1,
  },
  waterReflection: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: height * 0.3, // Covers bottom 30% of screen
    width: width,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  waterShimmer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    opacity: 0.6,
  },
});

export default BeachSunset;
