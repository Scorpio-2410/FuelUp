// Night Theme Celestial Background Component
// Orchestrates the night sky elements: stars, clouds, and moon
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TimeBasedTheme } from '../../../constants/TimeBasedTheme';
import StarField from './StarField';
import CloudLayer from './CloudLayer';
import Moon from './Moon';

interface CelestialBackgroundProps {
  children?: React.ReactNode;
  theme?: TimeBasedTheme;
  intensity?: 'low' | 'medium' | 'high';
}

export const CelestialBackground: React.FC<CelestialBackgroundProps> = ({
  children,
  theme,
  intensity = 'medium'
}) => {
  // Check if current time is between 6:00 PM and 6:00 AM (night time)
  const checkIsNightTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Convert to minutes
    
    const nightStart = 18 * 60; // 6:00 PM = 1080 minutes
    const nightEnd = 6 * 60; // 6:00 AM = 360 minutes
    
    // Night time is from 6:00 PM to 6:00 AM (next day)
    return currentTime >= nightStart || currentTime < nightEnd;
  };

  // Initialize with the correct value immediately
  const [isNightTime, setIsNightTime] = useState(checkIsNightTime());

  // Update night time status
  const updateNightTimeStatus = () => {
    setIsNightTime(checkIsNightTime());
  };

  // Default to night theme with dark chill blue gradient
  const currentTheme = theme || {
    colors: {
      gradients: {
        background: ['#04040B', '#1E213C', '#304063'],
        primary: ['#04040B', '#1E213C', '#304063'],
        card: ['#1E213C', '#304063'],
      },
      effects: {
        star: '#ffffff',
        starGlow: 'rgba(255, 255, 255, 0.8)',
        shadow: 'rgba(0, 0, 0, 0.5)',
        glow: 'rgba(99, 102, 241, 0.3)',
      },
    },
  };

  // Initialize and update night time status
  useEffect(() => {
    updateNightTimeStatus();
    
    // Check every minute to update night time status
    const interval = setInterval(updateNightTimeStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);


  return (
    <View style={styles.container}>
      {/* Deep Indigo Night Sky Gradient Background */}
      <LinearGradient
        colors={['#04040B', '#1E213C', '#304063']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      {/* Cloud Layer */}
      <CloudLayer intensity={intensity} isNightTime={isNightTime} />
      
      {/* Moon */}
      <Moon isNightTime={isNightTime} />
      
      {/* Star Field */}
      <StarField intensity={intensity} isNightTime={isNightTime} />
      
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

export default CelestialBackground;
