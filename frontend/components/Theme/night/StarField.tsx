// Responsible for generating and animating stars during night time
import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDelay: number;
}

interface StarFieldProps {
  intensity?: 'low' | 'medium' | 'high';
  isNightTime: boolean;
}

export const StarField: React.FC<StarFieldProps> = ({
  intensity = 'medium',
  isNightTime
}) => {
  // Use state to ensure re-render when stars are generated
  const [stars, setStars] = React.useState<Star[]>([]);
  const starAnimatedValues = useRef<Animated.Value[]>([]);

  // Generate stars based on intensity (100% count with mixed animations)
  const generateStars = (): Star[] => {
    const starCount = intensity === 'low' ? 80 : intensity === 'medium' ? 120 : 180; // Full count
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

  useEffect(() => {
    if (isNightTime) {
      const generatedStars = generateStars();
      setStars(generatedStars);
      
      // Create animated values for each star
      starAnimatedValues.current = generatedStars.map(() => 
        new Animated.Value(0)
      );
      
        // Mix of animation styles for diversity (20% afternoon-style)
        starAnimatedValues.current.forEach((animatedValue, index) => {
          const star = generatedStars[index];
          
          // 20% get afternoon-style animation (more noticeable blinking)
          // 80% keep original night-style animation (subtle twinkling)
          const useAfternoonStyle = Math.random() < 0.2;
          
          if (useAfternoonStyle) {
            // Afternoon-style: more noticeable blinking
            Animated.loop(
              Animated.sequence([
                Animated.delay(star.animationDelay),
                Animated.timing(animatedValue, {
                  toValue: 1,
                  duration: 2000 + Math.random() * 3000, // 2-5 seconds (faster)
                  useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                  toValue: 0.3, // More dramatic fade
                  duration: 1000 + Math.random() * 2000, // 1-3 seconds
                  useNativeDriver: true,
                }),
              ])
            ).start();
          } else {
            // Original night-style: subtle twinkling
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
          }
        });
    } else {
      setStars([]);
    }
  }, [intensity, isNightTime]);

  if (!isNightTime) return null;

  return (
    <View style={styles.container}>
      {stars.map((star, index) => {
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
                  outputRange: [star.opacity * 0.6, star.opacity], // Works for both styles
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
    zIndex: 3,
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
});

export default StarField;
