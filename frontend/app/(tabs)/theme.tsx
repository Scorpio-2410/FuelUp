// Theme Dev Testing Tab
// Temporary tab for testing morning, afternoon, and night themes
// TODO: Delete before production - for dev testing only
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MorningBackground from '../../components/Theme/morning/MorningBackground';
import AfternoonBackground from '../../components/Theme/afternoon/AfternoonBackground';
import CelestialBackground from '../../components/Theme/night/CelestialBackground';
import StreakCongratulationsAlert from '../../components/Steps/StreakCongratulationsAlert';
import StreakLostAlert from '../../components/Steps/StreakLostAlert';

type ThemeMode = 'morning' | 'afternoon' | 'night';

export default function ThemePreview() {
  const [activeTheme, setActiveTheme] = useState<ThemeMode>('afternoon');
  const [showCongratsAlert, setShowCongratsAlert] = useState(false);
  const [showLostAlert, setShowLostAlert] = useState(false);
  const [streakCount, setStreakCount] = useState(7);

  return (
    <View style={styles.container}>
      {/* Full screen theme background - no blockers */}
      {activeTheme === 'morning' && <MorningBackground />}
      {activeTheme === 'afternoon' && <AfternoonBackground intensity="medium" />}
      {activeTheme === 'night' && <CelestialBackground intensity="medium" forceNightMode={true} />}

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
            activeTheme === 'afternoon' && styles.activeButton
          ]}
          onPress={() => setActiveTheme('afternoon')}
        >
          <Text style={[
            styles.buttonText,
            activeTheme === 'afternoon' && styles.activeButtonText
          ]}>
            🌅 Afternoon
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

      {/* Alert Test Buttons - Center of Screen */}
      <View style={styles.alertButtonsContainer}>
        <Text style={styles.alertTitle}>🔥 Test Alerts 🔥</Text>
        
        {/* Streak Counter */}
        <View style={styles.counterContainer}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => setStreakCount(Math.max(1, streakCount - 1))}
          >
            <Text style={styles.counterButtonText}>−</Text>
          </TouchableOpacity>
          
          <Text style={styles.counterText}>{streakCount} days</Text>
          
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => setStreakCount(streakCount + 1)}
          >
            <Text style={styles.counterButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Congrats Alert Button */}
        <TouchableOpacity
          style={[styles.alertButton, styles.congratsButton]}
          onPress={() => setShowCongratsAlert(true)}
        >
          <Text style={styles.alertButtonText}>🔥 Show Congrats Alert</Text>
        </TouchableOpacity>

        {/* Lost Alert Button */}
        <TouchableOpacity
          style={[styles.alertButton, styles.lostButton]}
          onPress={() => setShowLostAlert(true)}
        >
          <Text style={styles.alertButtonText}>💔 Show Streak Lost</Text>
        </TouchableOpacity>
      </View>

      {/* Alert Components */}
      <StreakCongratulationsAlert
        visible={showCongratsAlert}
        streakCount={streakCount}
        onClose={() => setShowCongratsAlert(false)}
      />

      <StreakLostAlert
        visible={showLostAlert}
        previousStreak={streakCount}
        onClose={() => setShowLostAlert(false)}
      />
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
  alertButtonsContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -120 }],
    width: 300,
    alignItems: 'center',
    gap: 16,
    zIndex: 999,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  counterButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  counterText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    minWidth: 80,
    textAlign: 'center',
  },
  alertButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  congratsButton: {
    backgroundColor: 'rgba(255, 107, 53, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(255, 165, 0, 0.6)',
  },
  lostButton: {
    backgroundColor: 'rgba(79, 70, 229, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.6)',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});