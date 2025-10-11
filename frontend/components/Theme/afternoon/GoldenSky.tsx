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
      {/* Layer 1: Purple to warm cream gradient with bridge stops */}
      <LinearGradient
        colors={[
          '#2B364B', // Deep twilight
          '#262E4D', // Twilight start
          '#343A63', // Indigo
          '#4B3F78', // Violet
          '#65498E', // Purple
          '#7D4F93', // Dusty purple
          '#A45E8A', // Rose-mauve
          '#B86B89', // Bridge 1 (mauve→rose)
          '#C87781', // Bridge 2
          '#D58473', // Rose-gold
          '#E09063', // Apricot
          '#EA9C58', // Amber
          '#F1AA5A', // Warm golden-orange
          '#F8C16A', // Bright gold
          '#FFE096', // Pale butter
          '#FFF0C9', // Warm cream
          '#FFF7E8'  // Soft cream footer
        ]}
        locations={[0,0.06,0.12,0.22,0.32,0.42,0.52, 0.58,0.63,0.68,0.74,0.80,0.86,0.92,0.96,0.985,1.00]}
        start={{x:0.5,y:0}} end={{x:0.5,y:1}}
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
      
      {/* Layer 3: Twilight veil at the handoff (super subtle) */}
      <LinearGradient
        colors={['rgba(184,107,137,0.08)','rgba(234,156,88,0.08)','rgba(234,156,88,0)']}
        locations={[0,0.55,1]}
        start={{x:0.5,y:0}} end={{x:0.5,y:1}}
        style={styles.twilightVeil}
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
  twilightVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: height * 0.56,
    height: height * 0.22, // Covers the handoff zone (56-78% screen height)
    width: width,
  },
});

export default GoldenSky;

