// Afternoon StarField Component
// Shows stars only in the top 40% of screen for twilight atmosphere
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

interface AfternoonStarFieldProps {
  intensity?: 'light' | 'medium' | 'strong';
}

export const AfternoonStarField: React.FC<AfternoonStarFieldProps> = ({
  intensity = 'medium'
}) => {
  // Use state to ensure re-render when stars are generated
  const [stars, setStars] = React.useState<Star[]>([]);
  const starAnimatedValues = useRef<Animated.Value[]>([]);

  // Generate stars only in top 40% of screen
  const generateStars = (): Star[] => {
    const starCount = intensity === 'light' ? 46 : intensity === 'medium' ? 69 : 92;
    const stars: Star[] = [];
    const topAreaHeight = height * 0.4; // Only top 40% of screen
    
    for (let i = 0; i < starCount; i++) {
      stars.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * topAreaHeight, // Only in top 40%
        size: Math.random() * 1.8 + 0.8, // Smaller stars (0.8-2.6px)
        opacity: Math.random() * 0.4 + 0.2, // Dimmer for twilight (0.2-0.6)
        animationDelay: Math.random() * 400, // 0-0.4s delay for faster appearance
      });
    }
    
    return stars;
  };

  useEffect(() => {
    const generatedStars = generateStars();
    setStars(generatedStars);
    
    // Initialize animated values for each star with immediate visibility
    starAnimatedValues.current = generatedStars.map((star) => new Animated.Value(star.opacity * 0.7));
    
    // Mix of animation styles for diversity (10% night-style)
    generatedStars.forEach((star, index) => {
      const animatedValue = starAnimatedValues.current[index];
      
      // 10% get night-style animation (subtle twinkling)
      // 90% keep afternoon-style animation (more noticeable blinking)
      const useNightStyle = Math.random() < 0.1;
      
      const animateStar = () => {
        if (useNightStyle) {
          // Night-style: subtle twinkling
          Animated.loop(
            Animated.sequence([
              Animated.timing(animatedValue, {
                toValue: 1,
                duration: 3000 + Math.random() * 3000, // 3-6 seconds (slower)
                useNativeDriver: true,
              }),
              Animated.timing(animatedValue, {
                toValue: 0,
                duration: 3000 + Math.random() * 3000, // 3-6 seconds (slower)
                useNativeDriver: true,
              }),
            ])
          ).start();
        } else {
          // Afternoon-style: more noticeable blinking
          Animated.loop(
            Animated.sequence([
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
        }
      };
      
      // Start animation after delay
      setTimeout(animateStar, star.animationDelay);
    });
  }, [intensity]);

  return (
    <View style={styles.container} pointerEvents="none">
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
                      outputRange: [0.9, 1.1, 0.9], // Subtle scale animation like night
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
    height: height * 0.4, // Only top 40% of screen
    zIndex: 1,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
});

export default AfternoonStarField;
