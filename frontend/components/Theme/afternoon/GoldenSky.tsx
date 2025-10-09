// Golden Sky Gradient Component
// Creates the warm orange→yellow gradient with twilight cap and cool footer
// Supports both single-pass and layered gradient options
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface GoldenSkyProps {
  intensity?: 'light' | 'medium' | 'strong';
}

const GoldenSky: React.FC<GoldenSkyProps> = ({ intensity = 'medium' }) => {
  // Use layered gradient for richer visual effect
  return (
    <View style={styles.container}>
      {/* Layer 1: Base warm→cool gradient (more orange-red) */}
      <LinearGradient
        colors={[
          '#FF6B35', // Orange-red
          '#FF7F4A', // Orange-red light
          '#FF8C5A', // Orange-red lighter
          '#FF9B6B', // Orange-red lightest
          '#D8EAFE', // Cool sky blue
          '#A7CCFF', // Lighter cool blue
        ]}
        locations={[0, 0.30, 0.55, 0.72, 0.90, 1.0]}
        style={styles.baseGradient}
      />
      
      {/* Layer 2: More extended night cap at top (fades to transparent) */}
      <LinearGradient
        colors={[
          '#0F1419',           // Very dark night (top)
          '#1A1F2E',           // Darker night carryover
          '#2B364B',           // Night carryover
          '#262E4D',           // Twilight
          'rgba(38,46,77,0)',  // Fade to transparent
        ]}
        locations={[0, 0.12, 0.22, 0.32, 0.40]}
        style={styles.nightCap}
      />
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
    width: width,
    height: height,
  },
  baseGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
  },
  nightCap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.40, // More extended to affect top ~40%
    width: width,
  },
});

export default GoldenSky;

