// Night StarField Component
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

interface NightStarFieldProps {
  intensity?: 'low' | 'medium' | 'high';
  isNightTime: boolean;
}

export const NightStarField: React.FC<NightStarFieldProps> = ({
  intensity = 'medium',
  isNightTime
}) => {
  // Use state to ensure re-render when stars are generated
  const [stars, setStars] = React.useState<Star[]>([]);
  const starAnimatedValues = useRef<Animated.Value[]>([]);

  // Generate stars based on intensity (100% count with mixed animations)
  const generateStars = (): Star[] => {
    const starCount = intensity === 'low' ? 92 : intensity === 'medium' ? 130 : 190; // Full count + 15%
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
      
      // Initialize animated values for each star
      starAnimatedValues.current = generatedStars.map(() => new Animated.Value(0));
      
      // Mix of animation styles for diversity (20% twinkling, 80% steady)
      generatedStars.forEach((star, index) => {
        const animatedValue = starAnimatedValues.current[index];
        
        // 20% get twinkling animation, 80% stay steady
        const useTwinkling = Math.random() < 0.2;
        
        const animateStar = () => {
          if (useTwinkling) {
            // Twinkling stars
            Animated.loop(
              Animated.sequence([
                Animated.timing(animatedValue, {
                  toValue: 1,
                  duration: 2000 + Math.random() * 2000, // 2-4 seconds
                  useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                  toValue: 0.3,
                  duration: 1000 + Math.random() * 1000, // 1-2 seconds
                  useNativeDriver: true,
                }),
              ])
            ).start();
          } else {
            // Steady stars with subtle variation
            Animated.loop(
              Animated.sequence([
                Animated.timing(animatedValue, {
                  toValue: 1,
                  duration: 4000 + Math.random() * 2000, // 4-6 seconds (slower)
                  useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                  toValue: 0.8, // Less dramatic fade for steady stars
                  duration: 2000 + Math.random() * 2000, // 2-4 seconds
                  useNativeDriver: true,
                }),
              ])
            ).start();
          }
        };
        
        // Start animation after delay
        setTimeout(animateStar, star.animationDelay);
      });
    } else {
      // Clear stars when not night time
      setStars([]);
      starAnimatedValues.current = [];
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
    zIndex: 2,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default NightStarField;
