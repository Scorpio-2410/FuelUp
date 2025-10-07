// Theme Preview Tab - For Development Purposes
// Pure theme view with no widgets - for visual testing only

import React from 'react';
import { View, StyleSheet } from 'react-native';
import CelestialBackground from '../../components/Theme/night/CelestialBackground';
import MorningBackground from '../../components/Theme/morning/MorningBackground';
import DynamicBackground from '../../components/Theme/DynamicBackground';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemePreview() {
  const { mode } = useTheme();

  const renderTheme = () => {
    // If auto mode is enabled, show DynamicBackground
    if (mode === 'auto') {
      return <DynamicBackground intensity="medium" />;
    }

    // For morning theme, use MorningBackground
    if (mode === 'morning') {
      return <MorningBackground />;
    }

    // For all night-time themes (midnight, dawn, night, evening, day), use CelestialBackground
    return <CelestialBackground intensity="medium" />;
  };

  return (
    <View style={styles.container}>
      {renderTheme()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

