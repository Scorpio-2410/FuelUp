// components/Theme/CelestialBackground.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TimeBasedTheme } from '../../../constants/TimeBasedTheme';

const { width, height } = Dimensions.get('window');

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDelay: number;
}

interface Cloud {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  animationDelay: number;
}

interface CelestialBackgroundProps {
  children?: React.ReactNode;
  showStars?: boolean;
  showClouds?: boolean;
  theme?: TimeBasedTheme;
  intensity?: 'low' | 'medium' | 'high';
}

export const CelestialBackground: React.FC<CelestialBackgroundProps> = ({
  children,
  showStars = true,
  showClouds = true,
  theme,
  intensity = 'medium'
}) => {
  const starsRef = useRef<Star[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const starAnimatedValues = useRef<Animated.Value[]>([]);
  const cloudAnimatedValues = useRef<Animated.Value[]>([]);

  // Default to night theme if no theme provided
  const currentTheme = theme || {
    colors: {
      gradients: {
        background: ['#1e1b4b', '#312e81', '#4338ca'],
        primary: ['#1e1b4b', '#312e81', '#4338ca'],
        card: ['#312e81', '#4338ca'],
      },
      effects: {
        star: '#ffffff',
        starGlow: 'rgba(255, 255, 255, 0.8)',
        shadow: 'rgba(0, 0, 0, 0.5)',
        glow: 'rgba(99, 102, 241, 0.3)',
      },
    },
  };

  // Generate stars based on intensity
  const generateStars = (): Star[] => {
    const starCount = intensity === 'low' ? 80 : intensity === 'medium' ? 120 : 180;
    const stars: Star[] = [];
    
    for (let i = 0; i < starCount; i++) {
      stars.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 1, // 1-3.5px for more visible stars
        opacity: Math.random() * 0.7 + 0.5, // 0.5-1.2 for brighter stars
        animationDelay: Math.random() * 3000, // 0-3s delay for varied timing
      });
    }
    
    return stars;
  };

  // Generate cloud wisps
  const generateClouds = (): Cloud[] => {
    const cloudCount = intensity === 'low' ? 3 : intensity === 'medium' ? 5 : 8;
    const clouds: Cloud[] = [];
    
    for (let i = 0; i < cloudCount; i++) {
      clouds.push({
        id: i,
        x: Math.random() * (width + 100) - 50, // Allow clouds to extend beyond screen
        y: Math.random() * (height * 0.6), // Keep clouds in upper portion
        width: Math.random() * 200 + 100, // 100-300px wide
        height: Math.random() * 80 + 40, // 40-120px tall
        opacity: Math.random() * 0.2 + 0.1, // More visible clouds, 0.1-0.3
        animationDelay: Math.random() * 5000, // 0-5s delay
      });
    }
    
    return clouds;
  };

  useEffect(() => {
    if (showStars) {
      starsRef.current = generateStars();
      
      // Create animated values for each star
      starAnimatedValues.current = starsRef.current.map(() => 
        new Animated.Value(0)
      );
      
      // Animate stars with staggered delays
      starAnimatedValues.current.forEach((animatedValue, index) => {
        const star = starsRef.current[index];
        
        Animated.loop(
          Animated.sequence([
            Animated.delay(star.animationDelay),
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 3000 + Math.random() * 3000, // 3-6s for slower, more realistic twinkling
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: 3000 + Math.random() * 3000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }

    if (showClouds) {
      cloudsRef.current = generateClouds();
      
      // Create animated values for each cloud
      cloudAnimatedValues.current = cloudsRef.current.map(() => 
        new Animated.Value(0)
      );
      
      // Animate clouds with slow, gentle movement
      cloudAnimatedValues.current.forEach((animatedValue, index) => {
        const cloud = cloudsRef.current[index];
        
        Animated.loop(
          Animated.sequence([
            Animated.delay(cloud.animationDelay),
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 8000 + Math.random() * 4000, // 8-12s for very slow drift
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: 8000 + Math.random() * 4000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }
  }, [showStars, showClouds, intensity]);

  const renderStars = () => {
    if (!showStars) return null;

    return starsRef.current.map((star, index) => {
      const animatedValue = starAnimatedValues.current[index];
      
      return (
        <Animated.View
          key={star.id}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              opacity: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [star.opacity * 0.6, star.opacity],
              }),
              transform: [
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.9, 1.1, 0.9],
                  }),
                },
              ],
            },
          ]}
        />
      );
    });
  };

  const renderClouds = () => {
    if (!showClouds) return null;

    return cloudsRef.current.map((cloud, index) => {
      const animatedValue = cloudAnimatedValues.current[index];
      
      return (
        <Animated.View
          key={cloud.id}
          style={[
            styles.cloud,
            {
              left: cloud.x,
              top: cloud.y,
              width: cloud.width,
              height: cloud.height,
              opacity: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [cloud.opacity * 0.5, cloud.opacity],
              }),
              transform: [
                {
                  translateX: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 30], // Gentle horizontal drift
                  }),
                },
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.95, 1.05, 0.95],
                  }),
                },
              ],
            },
          ]}
        />
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Deep Indigo Night Sky Gradient Background */}
      <LinearGradient
        colors={currentTheme.colors.gradients.background as [string, string, ...string[]]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Subtle Cloud Wisps Layer */}
      <View style={styles.cloudsContainer}>
        {renderClouds()}
      </View>
      
      {/* Stars Layer */}
      <View style={styles.starsContainer}>
        {renderStars()}
      </View>
      
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
  cloudsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 50,
    shadowColor: 'rgba(255, 255, 255, 0.9)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 4,
    elevation: 4,
  },
  cloud: {
    position: 'absolute',
    backgroundColor: '#1A2332',
    borderRadius: 50,
    opacity: 0.15,
  },
  content: {
    flex: 1,
    zIndex: 3,
  },
});

export default CelestialBackground;
