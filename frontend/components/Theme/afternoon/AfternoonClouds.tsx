// Afternoon Clouds Component
// Fewer clouds than morning theme, mild and heavy types only
// Thin cirrus streaks with soft opacity for golden hour atmosphere
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
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
    // Only generate heavy near clouds for dramatic effect
    const cloudCount = 4; // Small number of heavy near clouds

    const generatedClouds: Cloud[] = [];

    for (let i = 0; i < cloudCount; i++) {
      const cloud: Cloud = {
        id: `near-heavy-${i}-${Date.now()}`,
        x: Math.random() * (width - 120) + 60,
        y: Math.random() * (height * 0.5) + height * 0.1, // Middle to upper-middle area
        type: 'heavy', // Only heavy clouds
        depth: 'near', // Only near clouds
        translateX: new Animated.Value(0),
        direction: Math.random() < 0.5 ? 1 : -1,
        speed: 0.8, // Moderate speed for near clouds
        opacity: 0.5, // More visible than far/mid clouds
      };

      generatedClouds.push(cloud);
      startCloudAnimation(cloud);
    }

    setClouds(generatedClouds);
  }, []);

  const startCloudAnimation = (cloud: Cloud) => {
    const distance = width * 0.4 * cloud.direction; // Slightly longer distance for near clouds
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(cloud.translateX, {
          toValue: distance,
          duration: 45000 / cloud.speed, // Slower for graceful movement
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(cloud.translateX, {
          toValue: 0,
          duration: 45000 / cloud.speed,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  };

  // Render heavy near clouds only
  const renderCloud = (cloud: Cloud) => {
    const baseSize = 54; // Near cloud size
    
    // Heavy clouds: 6-7 bubbles, more defined and dramatic
    return (
      <G key={cloud.id}>
        <Ellipse cx={0} cy={0} rx={baseSize * 1.3} ry={baseSize * 0.8} fill="#FFFFFF" />
        <Ellipse cx={baseSize * 1.0} cy={-baseSize * 0.4} rx={baseSize * 1.1} ry={baseSize * 0.7} fill="#FFFFFF" />
        <Ellipse cx={-baseSize * 0.9} cy={baseSize * 0.2} rx={baseSize * 1.0} ry={baseSize * 0.65} fill="#FFFFFF" />
        <Ellipse cx={baseSize * 1.9} cy={baseSize * 0.25} rx={baseSize * 0.9} ry={baseSize * 0.6} fill="#FFFFFF" />
        <Ellipse cx={baseSize * 2.6} cy={-baseSize * 0.15} rx={baseSize * 0.8} ry={baseSize * 0.55} fill="#FFFFFF" />
        <Ellipse cx={-baseSize * 1.6} cy={-baseSize * 0.25} rx={baseSize * 0.75} ry={baseSize * 0.5} fill="#FFFFFF" />
        <Ellipse cx={baseSize * 0.5} cy={baseSize * 0.4} rx={baseSize * 0.6} ry={baseSize * 0.4} fill="#FFFFFF" />
      </G>
    );
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

