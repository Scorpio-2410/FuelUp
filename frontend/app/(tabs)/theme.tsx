// Theme Preview Tab - For Development Purposes
// Shows both night and morning themes side by side with controls
// Changes made here will reflect on the Homepage tab!

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CelestialBackground from '../../components/Theme/night/CelestialBackground';
import MorningBackground from '../../components/Theme/morning/MorningBackground';
import DynamicBackground from '../../components/Theme/DynamicBackground';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeMode } from '../../constants/TimeBasedTheme';

type Intensity = 'low' | 'medium' | 'high';

export default function ThemePreview() {
  const { mode, setMode, isAuto } = useTheme();
  const [intensity, setIntensity] = useState<Intensity>('medium');
  const [showControls, setShowControls] = useState(true);

  const renderTheme = () => {
    // If auto mode is enabled, show DynamicBackground
    if (mode === 'auto') {
      return (
        <DynamicBackground intensity={intensity}>
          <ThemeInfo mode="auto" currentMode={mode} />
        </DynamicBackground>
      );
    }

    // For morning theme, use MorningBackground
    if (mode === 'morning') {
      return (
        <MorningBackground>
          <ThemeInfo mode={mode} currentMode={mode} />
        </MorningBackground>
      );
    }

    // For all night-time themes (midnight, dawn, night, evening, day), use CelestialBackground
    return (
      <CelestialBackground intensity={intensity}>
        <ThemeInfo mode={mode} currentMode={mode} />
      </CelestialBackground>
    );
  };

  return (
    <View style={styles.container}>
      {renderTheme()}
      
      {/* Control Panel Overlay */}
      {showControls && (
        <View style={styles.controlPanel}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10 }}
          >
            <View style={styles.controlHeader}>
              <Text style={styles.controlTitle}>🎨 Theme Controls</Text>
              <TouchableOpacity 
                onPress={() => setShowControls(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

          {/* Theme Mode Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Theme Mode (applies to Homepage too!)</Text>
            <View style={styles.buttonGroup}>
              <ThemeButton
                label="Auto"
                active={mode === 'auto'}
                onPress={() => setMode('auto')}
              />
              <ThemeButton
                label="Morning"
                active={mode === 'morning'}
                onPress={() => setMode('morning')}
              />
              <ThemeButton
                label="Night"
                active={mode === 'night'}
                onPress={() => setMode('night')}
              />
            </View>
            <View style={[styles.buttonGroup, { marginTop: 10 }]}>
              <ThemeButton
                label="Dawn"
                active={mode === 'dawn'}
                onPress={() => setMode('dawn')}
              />
              <ThemeButton
                label="Day"
                active={mode === 'day'}
                onPress={() => setMode('day')}
              />
              <ThemeButton
                label="Evening"
                active={mode === 'evening'}
                onPress={() => setMode('evening')}
              />
            </View>
            <View style={[styles.buttonGroup, { marginTop: 10 }]}>
              <ThemeButton
                label="Midnight"
                active={mode === 'midnight'}
                onPress={() => setMode('midnight')}
              />
            </View>
          </View>

          {/* Intensity Selection (for non-morning themes) */}
          {mode !== 'morning' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Intensity (visual effect strength)</Text>
              <View style={styles.buttonGroup}>
                <IntensityButton
                  label="Low"
                  active={intensity === 'low'}
                  onPress={() => setIntensity('low')}
                />
                <IntensityButton
                  label="Medium"
                  active={intensity === 'medium'}
                  onPress={() => setIntensity('medium')}
                />
                <IntensityButton
                  label="High"
                  active={intensity === 'high'}
                  onPress={() => setIntensity('high')}
                />
              </View>
            </View>
          )}

          {/* Info */}
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              💡 Switch to Homepage tab to see theme with real content
            </Text>
            <Text style={styles.infoText}>
              🎨 Changes here apply globally across the app
            </Text>
            <Text style={styles.infoText}>
              ⚙️ This tab is for development/testing only
            </Text>
          </View>
          </ScrollView>
        </View>
      )}

      {/* Floating Toggle Button (when controls hidden) */}
      {!showControls && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowControls(true)}
        >
          <Text style={styles.floatingButtonText}>⚙️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Theme Info Component (displays in center of screen)
function ThemeInfo({ mode, currentMode }: { mode: ThemeMode; currentMode: ThemeMode }) {
  const getThemeIcon = (m: ThemeMode) => {
    switch (m) {
      case 'midnight': return '🌌';
      case 'dawn': return '🌅';
      case 'morning': return '☀️';
      case 'day': return '🌤️';
      case 'evening': return '🌆';
      case 'night': return '🌙';
      case 'auto': return '🔄';
      default: return '🎨';
    }
  };

  const getThemeDescription = (m: ThemeMode) => {
    switch (m) {
      case 'midnight': return 'Deep dark theme with minimal stars (12 AM - 4 AM)';
      case 'dawn': return 'Soft purple/blue transition theme (4 AM - 7 AM)';
      case 'morning': return 'Bright blue sky with sun bloom and cloud layers (7 AM - 12 PM)';
      case 'day': return 'Bright and energetic daytime theme (12 PM - 5 PM)';
      case 'evening': return 'Golden hour warm sunset theme (5 PM - 8 PM)';
      case 'night': return 'Deep blue night with stars and moon (8 PM - 12 AM)';
      case 'auto': return 'Automatically switches based on current time';
      default: return 'Custom theme';
    }
  };

  return (
    <View style={styles.themeInfo}>
      <View style={styles.themeInfoCard}>
        <Text style={styles.themeInfoTitle}>
          {getThemeIcon(mode)} {mode.charAt(0).toUpperCase() + mode.slice(1)} Theme
        </Text>
        <Text style={styles.themeInfoSubtitle}>
          {getThemeDescription(mode)}
        </Text>
        {mode === 'auto' && (
          <Text style={[styles.themeInfoSubtitle, { marginTop: 10, fontStyle: 'italic', fontSize: 14 }]}>
            Currently showing: {getThemeIcon(currentMode)} {currentMode}
          </Text>
        )}
      </View>
    </View>
  );
}

// Theme Button Component
function ThemeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.button, active && styles.buttonActive]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, active && styles.buttonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Intensity Button Component
function IntensityButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.intensityButton, active && styles.intensityButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.intensityButtonText, active && styles.intensityButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlPanel: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    maxHeight: '75%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  buttonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#0055CC',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  buttonTextActive: {
    color: '#fff',
  },
  intensityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  intensityButtonActive: {
    backgroundColor: '#34C759',
    borderColor: '#28A745',
  },
  intensityButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  intensityButtonTextActive: {
    color: '#fff',
  },
  infoSection: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  floatingButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    fontSize: 24,
  },
  themeInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  themeInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 30,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  themeInfoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  themeInfoSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

