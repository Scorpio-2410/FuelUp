// Dynamic Background Component
// Automatically switches between night, morning, and afternoon themes based on time
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TimeBasedTheme } from '../../constants/TimeBasedTheme';
import CelestialBackground from './night/CelestialBackground';
import MorningBackground from './morning/MorningBackground';
import AfternoonBackground from './afternoon/AfternoonBackground';

interface DynamicBackgroundProps {
  children?: React.ReactNode;
  theme?: TimeBasedTheme;
  intensity?: 'low' | 'medium' | 'high';
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  children,
  theme,
  intensity = 'medium'
}) => {
  const [currentTheme, setCurrentTheme] = useState<'morning' | 'afternoon' | 'night'>('morning');

  // Determine theme based on time of day
  const getTimeBasedTheme = (): 'morning' | 'afternoon' | 'night' => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // Convert to minutes
    
    const morningStart = 6 * 60;    // 6:00 AM
    const afternoonStart = 16 * 60; // 4:00 PM (golden hour starts)
    const nightStart = 18 * 60 + 30; // 6:30 PM
    
    if (currentTime >= morningStart && currentTime < afternoonStart) {
      return 'morning';
    } else if (currentTime >= afternoonStart && currentTime < nightStart) {
      return 'afternoon';
    } else {
      return 'night';
    }
  };

  // Update theme based on time
  const updateTheme = () => {
    setCurrentTheme(getTimeBasedTheme());
  };

  // Initialize and update theme
  useEffect(() => {
    updateTheme();
    
    // Check every minute to update theme
    const interval = setInterval(updateTheme, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Render appropriate background based on time
  if (currentTheme === 'morning') {
    return (
      <MorningBackground>
        {children}
      </MorningBackground>
    );
  }

  if (currentTheme === 'afternoon') {
    return (
      <View style={{ flex: 1 }}>
        <AfternoonBackground intensity={intensity as 'light' | 'medium' | 'strong'} />
        {children}
      </View>
    );
  }

  // Default to night theme
  return (
    <CelestialBackground theme={theme} intensity={intensity}>
      {children}
    </CelestialBackground>
  );
};

export default DynamicBackground;
