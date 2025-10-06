// Dynamic Background Component
// Automatically switches between night and morning themes based on time
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TimeBasedTheme } from '../../constants/TimeBasedTheme';
import CelestialBackground from './night/CelestialBackground';
import MorningBackground from './morning/MorningBackground';

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
  const [isMorningTime, setIsMorningTime] = useState(false);

  // Check if current time is morning (6:00 AM - 12:00 PM)
  const checkIsMorningTime = () => {
    // FOR TESTING: Always return true to force morning theme
    return true;
    
    // Original time-based logic (commented out for testing)
    // const now = new Date();
    // const currentHour = now.getHours();
    // const currentMinute = now.getMinutes();
    // const currentTime = currentHour * 60 + currentMinute; // Convert to minutes
    
    // const morningStart = 6 * 60; // 6:00 AM = 360 minutes
    // const morningEnd = 12 * 60; // 12:00 PM = 720 minutes
    
    // // Morning time is from 6:00 AM to 12:00 PM
    // return currentTime >= morningStart && currentTime < morningEnd;
  };

  // Update morning time status
  const updateMorningTimeStatus = () => {
    setIsMorningTime(checkIsMorningTime());
  };

  // Initialize and update morning time status
  useEffect(() => {
    updateMorningTimeStatus();
    
    // Check every minute to update morning time status
    const interval = setInterval(updateMorningTimeStatus, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Render appropriate background based on time
  if (isMorningTime) {
    return (
      <MorningBackground theme={theme} intensity={intensity}>
        {children}
      </MorningBackground>
    );
  }

  // Default to night theme for all other times
  return (
    <CelestialBackground theme={theme} intensity={intensity}>
      {children}
    </CelestialBackground>
  );
};

export default DynamicBackground;
