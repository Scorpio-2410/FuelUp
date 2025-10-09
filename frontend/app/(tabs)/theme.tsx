// Theme Dev Testing Tab
// Temporary tab for testing morning and night themes
// TODO: Delete before production - for dev testing only
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MorningBackground from '../../components/Theme/morning/MorningBackground';
import CelestialBackground from '../../components/Theme/night/CelestialBackground';

type ThemeMode = 'morning' | 'night';

export default function ThemePreview() {
  const [activeTheme, setActiveTheme] = useState<ThemeMode>('morning');

  return (
    <View style={styles.container}>
      {/* Full screen theme background - no blockers */}
      {activeTheme === 'morning' ? (
        <MorningBackground />
      ) : (
        <CelestialBackground intensity="medium" forceNightMode={true} />
      )}

      {/* Small toggle buttons at top */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            activeTheme === 'morning' && styles.activeButton
          ]}
          onPress={() => setActiveTheme('morning')}
        >
          <Text style={[
            styles.buttonText,
            activeTheme === 'morning' && styles.activeButtonText
          ]}>
            ☀️ Morning
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            activeTheme === 'night' && styles.activeButton
          ]}
          onPress={() => setActiveTheme('night')}
        >
          <Text style={[
            styles.buttonText,
            activeTheme === 'night' && styles.activeButtonText
          ]}>
            🌙 Night
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    position: 'relative',
  },
  buttonContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    zIndex: 1000,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(255, 255, 255, 1)',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  activeButtonText: {
    color: '#1a1a1a',
  },
});
