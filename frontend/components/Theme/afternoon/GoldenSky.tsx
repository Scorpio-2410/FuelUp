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
      {/* Layer 1: Base warm→cool gradient */}
      <LinearGradient
        colors={[
          '#FFB347', // Warm orange
          '#FFC463', // Golden orange
          '#FFD66B', // Golden yellow
          '#FFE89D', // Light yellow
          '#D8EAFE', // Cool sky blue
          '#A7CCFF', // Lighter cool blue
        ]}
        locations={[0, 0.30, 0.55, 0.72, 0.90, 1.0]}
        style={styles.baseGradient}
      />
      
      {/* Layer 2: Night cap at top (fades to transparent) */}
      <LinearGradient
        colors={[
          '#2B364B',           // Night carryover (top)
          '#262E4D',           // Twilight
          'rgba(38,46,77,0)',  // Fade to transparent
        ]}
        locations={[0, 0.10, 0.14]}
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
    height: height * 0.15, // Only affects top ~15%
    width: width,
  },
});

export default GoldenSky;

