// Afternoon Theme Background Component
// Orchestrates all afternoon/golden hour elements: gradient sky, sunset, clouds
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GoldenSky from './GoldenSky';
import HorizonSun from './HorizonSun';
import AfternoonClouds from './AfternoonClouds';

interface AfternoonBackgroundProps {
  intensity?: 'light' | 'medium' | 'strong';
  children?: React.ReactNode;
}

const AfternoonBackground: React.FC<AfternoonBackgroundProps> = ({ 
  intensity = 'medium',
  children
}) => {
  return (
    <View style={styles.container}>
      {/* Golden hour sky gradient */}
      <GoldenSky intensity={intensity} />
      
      {/* Sun at the horizon (half-visible) */}
      <HorizonSun />
      
      {/* Cirrus clouds (fewer than morning, mild/heavy only) */}
      <AfternoonClouds intensity={intensity} />
      
      {/* Children content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
});

export default AfternoonBackground;

