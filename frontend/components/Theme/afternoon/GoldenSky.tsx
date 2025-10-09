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
      {/* Layer 1: Purple to orange gradient (beautiful sunset transition) */}
      <LinearGradient
        colors={[
          '#2B364B', // Night top
          '#262E4D', // Twilight start
          '#343A63', // Indigo
          '#4B3F78', // Violet
          '#65498E', // Purple
          '#7D4F93', // Dusty purple → magenta
          '#A45E8A', // Rose-mauve (bridges warm/cool)
          '#C96E74', // Rose-gold
          '#E67E62', // Warm orange
          '#FFB659', // Golden
          '#FFE089', // Pale yellow
          '#D8EAFE', // Cool footer blend
          '#A7CCFF', // Cool footer
        ]}
        locations={[0, 0.06, 0.12, 0.22, 0.32, 0.42, 0.52, 0.60, 0.68, 0.78, 0.86, 0.94, 1.0]}
        style={styles.baseGradient}
      />
      
      {/* Layer 2: Subtle top enhancement (optional dark overlay) */}
      <LinearGradient
        colors={[
          '#0F1419',           // Very dark night (top)
          'rgba(15,20,25,0)',  // Fade to transparent quickly
        ]}
        locations={[0, 0.15]}
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
    height: height * 0.15, // Reduced since main gradient handles the transition
    width: width,
  },
});

export default GoldenSky;

