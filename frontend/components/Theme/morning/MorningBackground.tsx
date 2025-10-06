// Morning Theme Background Component
// Orchestrates the morning sky elements: sun bloom, clouds, and sky gradient
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TimeBasedTheme } from '../../../constants/TimeBasedTheme';
import SunBloom from './SunBloom';
import CloudLayer from './CloudLayer';

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
  const [isMorningTime, setIsMorningTime] = useState(false);

  // Check if current time is between 6:00 AM and 12:00 PM (morning time)
  const checkIsMorningTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Convert to minutes
    
    const morningStart = 6 * 60; // 6:00 AM = 360 minutes
    const morningEnd = 12 * 60; // 12:00 PM = 720 minutes
    
    // Morning time is from 6:00 AM to 12:00 PM
    return currentTime >= morningStart && currentTime < morningEnd;
  };

  // Update morning time status
  const updateMorningTimeStatus = () => {
    setIsMorningTime(checkIsMorningTime());
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
      
      {/* Sun Bloom Effect */}
      <SunBloom intensity={intensity} isMorningTime={isMorningTime} />
      
      {/* Cloud Layer */}
      <CloudLayer intensity={intensity} isMorningTime={isMorningTime} />
      
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
