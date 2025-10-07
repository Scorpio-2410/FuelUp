// Morning Theme Background Component
// Orchestrates the morning sky elements: sun bloom, clouds, and sky gradient
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TimeBasedTheme } from '../../../constants/TimeBasedTheme';
import SunBloom from './SunBloom';
import SoftFeatheryClouds from './SoftFeatheryClouds';
import CumulusClouds from './CumulusClouds';

interface MorningBackgroundProps {
  children?: React.ReactNode;
  theme?: TimeBasedTheme;
  intensity?: 'low' | 'medium' | 'high';
}

export const MorningBackground: React.FC<MorningBackgroundProps> = ({
  children,
  theme,
  intensity = 'medium'
}) => {
  const [isMorningTime, setIsMorningTime] = useState(true); // FOR TESTING: Always true

  // Update morning time status
  const updateMorningTimeStatus = () => {
    setIsMorningTime(true); // FOR TESTING: Always true
  };

  // Default to morning theme with bright blue gradient
  const currentTheme = theme || {
    colors: {
      gradients: {
        background: ['#7492BA', '#1A66B4', '#548CCA'],
        primary: ['#7492BA', '#1A66B4', '#548CCA'],
        card: ['#1A66B4', '#548CCA'],
      },
      effects: {
        sun: '#FFFFFF',
        sunGlow: 'rgba(255, 255, 255, 0.8)',
        shadow: 'rgba(0, 0, 0, 0.3)',
        glow: 'rgba(116, 146, 186, 0.4)',
      },
    },
  };

  // Initialize and update morning time status
  useEffect(() => {
    updateMorningTimeStatus();
    
    // Check every minute to update morning time status
    const interval = setInterval(updateMorningTimeStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Morning Sky Gradient Background */}
      <LinearGradient
        colors={['#7492BA', '#1A66B4', '#548CCA']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      {/* SVG Sun Bloom Effect */}
      <SunBloom />
      
      {/* Cloud Layers */}
      <SoftFeatheryClouds />
      <CumulusClouds />
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    zIndex: 4,
  },
});

export default MorningBackground;
