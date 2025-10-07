// Theme Preview Tab - Morning background (clean)
import React from 'react';
import { View, StyleSheet } from 'react-native';
import MorningBackground from '../../components/Theme/morning/MorningBackground';

export default function ThemePreview() {
  return (
    <View style={styles.container}>
      <MorningBackground />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  panel: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 24,
    gap: 8,
  },
  label: {
    color: '#eef6ff',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  lottie: { width: '92%', height: 160, borderRadius: 10, opacity: 0.9 },
  gl: { width: '100%', height: 200, borderRadius: 10 },
  missing: { color: '#FFD4D4', fontWeight: '600' },
  subtle: { color: '#D6E4F5' },
});

