// Afternoon Theme Background Component
// Orchestrates all afternoon/golden hour elements: gradient sky, sunset, stars
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GoldenSky from './GoldenSky';
import AfternoonSun from './AfternoonSun';
import AfternoonStarField from './AfternoonStarField';

interface AfternoonBackgroundProps {
  intensity?: 'light' | 'medium' | 'strong';
  children?: React.ReactNode;
}

const AfternoonBackground: React.FC<AfternoonBackgroundProps> = ({ 
  intensity = 'medium',
  children
}) => {
  return (
    <View style={styles.container}>
      {/* Golden hour sky gradient */}
      <GoldenSky intensity={intensity} />
      
      {/* Stars in top 40% (twilight stars) */}
      <AfternoonStarField intensity={intensity} />
      
      {/* Sun at the horizon (50-60% visible, moved up 80px total) */}
      <AfternoonSun />
      
      
      {/* Children content */}
      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    zIndex: 10,
  },
});

export default AfternoonBackground;

