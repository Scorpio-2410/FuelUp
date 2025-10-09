// Afternoon Clouds Component
// Fewer clouds than morning theme, mild and heavy types only
// Thin cirrus streaks with soft opacity for golden hour atmosphere
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { G, Ellipse } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface Cloud {
  id: string;
  x: number;
  y: number;
  type: 'mild' | 'heavy';
  depth: 'far' | 'mid' | 'near';
  translateX: Animated.Value;
  direction: number;
  speed: number;
  opacity: number;
}

interface AfternoonCloudsProps {
  intensity?: 'light' | 'medium' | 'strong';
}

const AfternoonClouds: React.FC<AfternoonCloudsProps> = ({ intensity = 'medium' }) => {
  const [clouds, setClouds] = useState<Cloud[]>([]);

  useEffect(() => {
    // Generate fewer clouds than morning (40% reduction)
    const cloudCounts = {
      far: 4,   // Reduced from 6-7
      mid: 5,   // Reduced from 7-8
      near: 3,  // Reduced from 5-6
    };

    const generatedClouds: Cloud[] = [];

    Object.entries(cloudCounts).forEach(([depth, count]) => {
      for (let i = 0; i < count; i++) {
        const cloud: Cloud = {
          id: `${depth}-${i}-${Date.now()}`,
          x: Math.random() * (width - 100) + 50,
          y: Math.random() * (height * 0.6), // Top 60% of screen
          type: Math.random() < 0.6 ? 'mild' : 'heavy', // 60% mild, 40% heavy
          depth: depth as 'far' | 'mid' | 'near',
          translateX: new Animated.Value(0),
          direction: Math.random() < 0.5 ? 1 : -1,
          speed: depth === 'far' ? 0.4 : depth === 'mid' ? 0.6 : 0.9,
          opacity: depth === 'far' ? 0.25 : depth === 'mid' ? 0.35 : 0.45, // Softer opacity
        };

        generatedClouds.push(cloud);
        startCloudAnimation(cloud);
      }
    });

    setClouds(generatedClouds);
  }, []);

  const startCloudAnimation = (cloud: Cloud) => {
    const distance = width * 0.3 * cloud.direction;
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(cloud.translateX, {
          toValue: distance,
          duration: 35000 / cloud.speed,
          useNativeDriver: true,
        }),
        Animated.timing(cloud.translateX, {
          toValue: 0,
          duration: 35000 / cloud.speed,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Render cloud bubbles based on type
  const renderCloud = (cloud: Cloud) => {
    const baseSize = cloud.depth === 'far' ? 32 : cloud.depth === 'mid' ? 42 : 54;
    
    if (cloud.type === 'mild') {
      // Mild: 4-5 bubbles, thin cirrus-like
      return (
        <G key={cloud.id}>
          <Ellipse cx={0} cy={0} rx={baseSize * 1.1} ry={baseSize * 0.5} fill="#FFFFFF" />
          <Ellipse cx={baseSize * 0.8} cy={-baseSize * 0.2} rx={baseSize * 0.9} ry={baseSize * 0.45} fill="#FFFFFF" />
          <Ellipse cx={-baseSize * 0.7} cy={baseSize * 0.1} rx={baseSize * 0.85} ry={baseSize * 0.4} fill="#FFFFFF" />
          <Ellipse cx={baseSize * 1.6} cy={baseSize * 0.15} rx={baseSize * 0.7} ry={baseSize * 0.35} fill="#FFFFFF" />
        </G>
      );
    } else {
      // Heavy: 6-7 bubbles, more defined
      return (
        <G key={cloud.id}>
          <Ellipse cx={0} cy={0} rx={baseSize * 1.2} ry={baseSize * 0.7} fill="#FFFFFF" />
          <Ellipse cx={baseSize * 0.9} cy={-baseSize * 0.3} rx={baseSize * 1.0} ry={baseSize * 0.65} fill="#FFFFFF" />
          <Ellipse cx={-baseSize * 0.8} cy={baseSize * 0.15} rx={baseSize * 0.95} ry={baseSize * 0.6} fill="#FFFFFF" />
          <Ellipse cx={baseSize * 1.8} cy={baseSize * 0.2} rx={baseSize * 0.85} ry={baseSize * 0.55} fill="#FFFFFF" />
          <Ellipse cx={baseSize * 2.5} cy={-baseSize * 0.1} rx={baseSize * 0.75} ry={baseSize * 0.5} fill="#FFFFFF" />
          <Ellipse cx={-baseSize * 1.5} cy={-baseSize * 0.2} rx={baseSize * 0.7} ry={baseSize * 0.45} fill="#FFFFFF" />
        </G>
      );
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={width + 200} height={height + 200} style={styles.svg}>
        {clouds.map((cloud) => (
          <Animated.View
            key={cloud.id}
            style={{
              position: 'absolute',
              transform: [{ translateX: cloud.translateX }],
              opacity: cloud.opacity,
            }}
          >
            <Svg
              width={200}
              height={120}
              viewBox="-100 -60 200 120"
              style={{ position: 'absolute', left: cloud.x, top: cloud.y }}
            >
              {renderCloud(cloud)}
            </Svg>
          </Animated.View>
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    bottom: -100,
    zIndex: 3,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default AfternoonClouds;

