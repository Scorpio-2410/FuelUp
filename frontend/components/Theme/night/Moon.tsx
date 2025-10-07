// Night Theme Moon Component – iOS Weather-style crescent (no more half-moon)
// Drop-in replacement
import React, { useEffect, useMemo, useRef } from 'react';
import { Dimensions, StyleSheet, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

type Phase = 'crescent' | 'gibbous' | 'full'; // trimmed to avoid random quarters
type LitSide = 'left' | 'right';

interface MoonProps {
  isNightTime: boolean;
  /** default: 'crescent' to match iOS Weather */
  phase?: Phase;
  /** 0.0 (paper-thin) … 1.0 (very thick) — default ~0.12 for thin crescent */
  crescentThickness?: number;
  /** which side is lit (screenshot = 'left') */
  litSide?: LitSide;
  /** pixel size (default 65) */
  size?: number;
  /** tilt in degrees (default 145 for dramatic angle) */
  tiltDeg?: number;
}

export const Moon: React.FC<MoonProps> = ({
  isNightTime,
  phase = 'crescent',
  crescentThickness = 0.12,
  litSide = 'left',
  size = 65,
  tiltDeg = 145,
}) => {
  const pulse = useRef(new Animated.Value(0)).current;

  const moon = useMemo(() => {
    if (!isNightTime) return null;
    return {
      x: width * 0.10 + Math.random() * (width * 0.12) + 28,
      y: height * 0.08 + Math.random() * (height * 0.12) + 11,
      size,
      phase,
    };
  }, [isNightTime, size, phase]);

  useEffect(() => {
    if (!moon) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 4200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 4200, useNativeDriver: true }),
      ])
    ).start();
  }, [moon]);

  if (!isNightTime || !moon) return null;

  const r = moon.size / 2;
  const cx = r;
  const cy = r;

  // Orientation helpers
  const isLeftLit = litSide === 'left';
  const dir = isLeftLit ? -1 : 1;

  // Crescent math:
  // we subtract a same-radius circle whose center is shifted toward the dark side.
  // Shift is close to the diameter for a thin crescent.
  // shiftFactor 1.6–2.2 ≈ very thin; 0.9–1.1 ≈ thick.
  const shiftFactor = 1.6 + (1.0 - crescentThickness) * 1.2; // much higher for thinner crescent
  const crescentShift = r * shiftFactor * dir;

  // Gibbous uses a small subtract on the *lit* side to leave a thin dark sliver.
  const gibbousShift = r * 0.55 * -dir;

  // IDs (no longer used for SVG, but might be useful for keys)
  const ids = {
    litGrad: 'litGrad',
    crater: 'crater',
  };

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          left: moon.x,
          top: moon.y,
          width: moon.size,
          height: moon.size,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }),
          transform: [
            { rotate: `${tiltDeg}deg` },
            { scale: pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.985, 1.015, 0.985] }) },
          ],
        },
      ]}
    >
      <View style={styles.moonContainer}>
        {/* The main lit part of the moon */}
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA', '#E5E8EC', '#B8BFD0']}
          style={styles.moonCircle}
        >
          {/* Craters */}
          <View style={[styles.crater, { top: '20%', left: '35%', width: r * 0.2, height: r * 0.2 }]} />
          <View style={[styles.crater, { top: '55%', left: '50%', width: r * 0.15, height: r * 0.15 }]} />
          <View style={[styles.crater, { top: '40%', left: '15%', width: r * 0.12, height: r * 0.12 }]} />
        </LinearGradient>

        {/* The dark part that creates the crescent shape */}
        <View
          style={[
            styles.darkCircle,
            {
              transform: [
                { translateX: isLeftLit ? -crescentShift : crescentShift },
              ],
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 2,
    // iOS-like glow - more prominent
    shadowColor: 'rgba(200, 210, 240, 0.45)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 22,
    elevation: 10,
  },
  moonContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    overflow: 'hidden',
    position: 'relative',
  },
  moonCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    position: 'absolute',
  },
  darkCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    backgroundColor: '#04040B', // Should match the top color of your CelestialBackground
    position: 'absolute',
  },
  crater: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 50,
  },
});

export default Moon;
