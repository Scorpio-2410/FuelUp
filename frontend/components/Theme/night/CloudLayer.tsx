// Night Theme Cloud Layer Component
// Responsible for generating and animating subtle cloud wisps during night time
import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Cloud {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  animationDelay: number;
}

interface CloudLayerProps {
  intensity?: 'low' | 'medium' | 'high';
  isNightTime: boolean;
}

export const CloudLayer: React.FC<CloudLayerProps> = ({
  intensity = 'medium',
  isNightTime
}) => {
  const cloudsRef = useRef<Cloud[]>([]);
  const cloudAnimatedValues = useRef<Animated.Value[]>([]);

  // Generate cloud wisps - more subtle and weather app-like
  const generateClouds = (): Cloud[] => {
    const cloudCount = intensity === 'low' ? 2 : intensity === 'medium' ? 4 : 6;
    const clouds: Cloud[] = [];
    
    for (let i = 0; i < cloudCount; i++) {
      clouds.push({
        id: i,
        x: Math.random() * (width + 200) - 100, // Allow clouds to extend beyond screen
        y: Math.random() * (height * 0.7), // Keep clouds in upper portion
        width: Math.random() * 300 + 150, // 150-450px wide for more realistic clouds
        height: Math.random() * 60 + 30, // 30-90px tall
        opacity: Math.random() * 0.15 + 0.05, // Subtle clouds, 0.05-0.2
        animationDelay: Math.random() * 8000, // 0-8s delay for slower movement
      });
    }
    
    return clouds;
  };

  useEffect(() => {
    if (isNightTime) {
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
  }, [intensity, isNightTime]);

  if (!isNightTime) return null;

  return (
    <View style={styles.container}>
      {cloudsRef.current.map((cloud, index) => {
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
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  cloud: {
    position: 'absolute',
    backgroundColor: '#1A2332',
    borderRadius: 50,
    opacity: 0.15,
  },
});

export default CloudLayer;
