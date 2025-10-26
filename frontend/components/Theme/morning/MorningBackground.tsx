//Assembles all morning theme elements into a cohesive sky scene.

import React, { useEffect, useState } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MorningSun from "./MorningSun";
import HazeVeil from "./HazeVeil";

const { width, height } = Dimensions.get('window');

// Shows stars only in upper 40% of screen where sun is located
const MorningStarField = () => {
  const [stars, setStars] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    animationDelay: number;
  }>>([]);
  const starAnimatedValues = React.useRef<Animated.Value[]>([]);

  // Generate stars only in upper 40% of screen
  const generateStars = () => {
    const starCount = 60; // Reduced count for morning
    const stars = [];
    const upperScreenHeight = height * 0.5; // Only upper 40% of screen
    
    for (let i = 0; i < starCount; i++) {
      stars.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * upperScreenHeight, // Only in upper 40%
        size: Math.random() * 2 + 1, // Smaller stars for morning
        opacity: Math.random() * 0.4 + 0.2, // More subtle opacity
        animationDelay: Math.random() * 300,
      });
    }
    
    return stars;
  };

  useEffect(() => {
    const generatedStars = generateStars();
    setStars(generatedStars);
    
    // Create animated values for each star with immediate visibility
    starAnimatedValues.current = generatedStars.map((star) => 
      new Animated.Value(star.opacity * 0.6)
    );
    
    // Animate stars with staggered delays
    starAnimatedValues.current.forEach((animatedValue, index) => {
      const star = generatedStars[index];
      
      Animated.loop(
        Animated.sequence([
          Animated.delay(star.animationDelay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 4000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 4000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.starField}>
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
                  outputRange: [star.opacity * 0.3, star.opacity],
                }),
                transform: [
                  {
                    scale: animatedValue.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.8, 1.1, 0.8],
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

export default function MorningBackground({ children }: { children?: React.ReactNode }) {
  return (
    <View style={styles.container}>
      {/* Sky gradient: transitions from soft blue-gray at top to deeper blue at bottom */}
      <LinearGradient
        colors={["#95A8C5","#8CA2BF","#5B81AF","#3A6EA6","#1D66B2","#1A68B8"]}
        locations={[0,0.2,0.4,0.6,0.8,1]}
        start={{x:0.5,y:0}}
        end={{x:0.5,y:1}}
        style={StyleSheet.absoluteFill}
      />

      {/* Atmospheric haze at top for depth */}
      <HazeVeil type="top" />

      {/* Sun with bloom, no animation */}
      <MorningSun size={90} disableAnimation />

      {/* Horizon haze for atmospheric perspective */}
      <HazeVeil type="horizon" />

      {/* Soft edge vignette (very subtle) */}
      <HazeVeil type="vignette" />

      {/* Morning star field - only in upper 40% where sun is */}
      <MorningStarField />

      {/* Page content on top */}
      <View style={styles.content} pointerEvents="box-none">{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, zIndex: 10 },
  starField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4, // Only upper 40% of screen
    zIndex: 2,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 50,
    shadowColor: 'rgba(255, 255, 255, 0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 3,
    elevation: 3,
  },
});
