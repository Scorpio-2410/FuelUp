// Morning Theme Sun Bloom Component
// Creates the bright sun bloom effect in the top-left corner
import React, { useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SunBloomProps {
  isMorningTime: boolean;
  intensity?: 'low' | 'medium' | 'high';
  /** Size of the sun bloom (default 800) */
  size?: number;
  /** Position offset from top-left (default -300, -200) */
  offsetX?: number;
  offsetY?: number;
}

export const SunBloom: React.FC<SunBloomProps> = ({
  isMorningTime,
  intensity = 'medium',
  size = 800,
  offsetX = -300,
  offsetY = -200,
}) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  // Intensity-based opacity
  const getIntensityOpacity = () => {
    switch (intensity) {
      case 'low': return 0.25;
      case 'medium': return 0.45;
      case 'high': return 0.65;
      default: return 0.45;
    }
  };

  useEffect(() => {
    if (!isMorningTime) return;

    // Gentle pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { 
          toValue: 1, 
          duration: 6000, 
          useNativeDriver: true 
        }),
        Animated.timing(pulse, { 
          toValue: 0, 
          duration: 6000, 
          useNativeDriver: true 
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { 
          toValue: 1, 
          duration: 8000, 
          useNativeDriver: true 
        }),
        Animated.timing(glow, { 
          toValue: 0, 
          duration: 8000, 
          useNativeDriver: true 
        }),
      ])
    ).start();
  }, [isMorningTime, intensity]);

  if (!isMorningTime) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sunBloom,
        {
          left: offsetX,
          top: offsetY,
          width: size,
          height: size,
          opacity: getIntensityOpacity(),
          transform: [
            { 
              scale: pulse.interpolate({ 
                inputRange: [0, 0.5, 1], 
                outputRange: [0.98, 1.02, 0.98] 
              }) 
            },
          ],
        },
      ]}
    >
      {/* Main sun bloom gradient */}
      <LinearGradient
        colors={['#FFFFFF', '#DDE9FF', 'rgba(221, 233, 255, 0)']}
        style={styles.gradient}
        start={{ x: 0.12, y: 0.06 }}
        end={{ x: 0.12, y: 0.06 }}
      />
      
      {/* Additional glow layer */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            opacity: glow.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.3, 0.6, 0.3]
            })
          }
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF', 'rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0)']}
          style={styles.gradient}
          start={{ x: 0.1, y: 0.05 }}
          end={{ x: 0.1, y: 0.05 }}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sunBloom: {
    position: 'absolute',
    zIndex: 1,
    borderRadius: 400,
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 400,
  },
  glowLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 400,
  },
});

export default SunBloom;
