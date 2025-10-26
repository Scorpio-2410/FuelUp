import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface FeatureCardProps {
  feature: Feature;
  index: number;
  style?: any;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index, style }) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(600 + index * 100).duration(500)}
      style={[styles.card, style]}
    >
      {/* Bold gradient background using feature color */}
      <LinearGradient
        colors={[`${feature.color}40`, `${feature.color}20`, `${feature.color}10`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      
      {/* Brighter icon with color */}
      <View style={[styles.iconContainer, { backgroundColor: `${feature.color}60` }]}>
        <Text style={styles.icon}>{feature.icon}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{feature.title}</Text>
        <Text style={styles.description}>{feature.description}</Text>
      </View>
      
      {/* Color accent border */}
      <View style={[styles.accentBorder, { backgroundColor: feature.color }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',  // Brighter border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  icon: {
    fontSize: 30,
  },
  content: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  description: {
    color: '#D1D5DB',  // Lighter text
    fontSize: 13,
    lineHeight: 18,
  },
  accentBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.8,
  },
});

export default FeatureCard;
