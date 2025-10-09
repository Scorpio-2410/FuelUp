// Organic Clouds - Realistic cloud rendering

import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Stop, G, Ellipse, LinearGradient } from "react-native-svg";
import { CloudConfig, CloudSpawner, CloudAnimationController } from "./CloudAnimationController";

const { width } = Dimensions.get("window");

interface OrganicCloudsProps {
  cloudCount?: number;
  depth: "far" | "mid" | "near";
  baseOpacity?: number;
  baseSpeed?: number;
}

export default function OrganicClouds({
  cloudCount = 5,
  depth,
  baseOpacity = 0.6,
  baseSpeed = 0.3,
}: OrganicCloudsProps) {
  // Use CloudSpawner to generate clouds with random positions
  const clouds = React.useMemo(() => CloudSpawner.generateClouds(cloudCount, depth), [cloudCount, depth]);

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { zIndex: depth === "near" ? 6 : depth === "mid" ? 5 : 4 },
      ]}
      pointerEvents="none"
    >
      {clouds.map((cloud) => (
        <OrganicCloud key={cloud.id} cloud={cloud} baseOpacity={baseOpacity} baseSpeed={baseSpeed} />
      ))}
    </View>
  );
}

// Individual organic cloud component with realistic SVG rendering
function OrganicCloud({
  cloud,
  baseOpacity,
  baseSpeed,
}: {
  cloud: CloudConfig;
  baseOpacity: number;
  baseSpeed: number;
}) {
  const horizontalAnim = useRef(new Animated.Value(0)).current;
  const verticalAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Set initial position - clouds spawn ON SCREEN and start moving immediately
    horizontalAnim.setValue(cloud.initialPosition);
    verticalAnim.setValue(Math.random());

    // Continuous horizontal drift - INFINITE LOOP with seamless reset
    const duration = CloudAnimationController.getAnimationDuration(baseSpeed, cloud.speed);
    
    // Determine start and end positions based on direction for seamless looping
    const startPos = cloud.direction === 1 ? 0 : 1; // L→R starts at 0, R→L starts at 1
    const endPos = cloud.direction === 1 ? 1 : 0;   // L→R ends at 1, R→L ends at 0
    
    const horizontalLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(horizontalAnim, {
          toValue: endPos, // Animate to opposite edge
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(horizontalAnim, {
          toValue: startPos, // Reset to starting edge (off-screen)
          duration: 0, // Instant reset
          useNativeDriver: true,
        }),
      ])
    );
    
    // Start immediately - NO DELAY for instant visibility
    horizontalLoop.start();

    // Gentle vertical wind sway with randomization
    const verticalDuration = CloudAnimationController.getVerticalSwayDuration();
    
    const verticalLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(verticalAnim, {
          toValue: 1,
          duration: verticalDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(verticalAnim, {
          toValue: 0,
          duration: verticalDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    
    // Start vertical animation immediately
    verticalLoop.start();

    return () => {
      horizontalLoop.stop();
      verticalLoop.stop();
    };
  }, [cloud.direction, cloud.initialPosition, baseSpeed, cloud.speed]);

  // Use CloudAnimationController for translation logic
  const [start, end] = CloudAnimationController.getTranslationRange(cloud.direction);
  const translateX = horizontalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [start, end],
  });

  const translateY = verticalAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, cloud.windSway, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: width * 0.5, // Center the container to accommodate full translation range
        top: cloud.y - cloud.size * 1.2,
        width: cloud.size * 3,
        height: cloud.size * 2.4,
        transform: [{ translateX }, { translateY }],
        opacity: cloud.opacity * baseOpacity,
      }}
    >
      <Svg width={cloud.size * 3} height={cloud.size * 2.4}>
        <Defs>
          {/* Main cloud gradient - enhanced realism */}
          <RadialGradient id={`mainGrad-${cloud.id}`} cx="50%" cy="30%" r="70%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1.0" />
            <Stop offset="25%" stopColor="#FAFCFF" stopOpacity="0.98" />
            <Stop offset="50%" stopColor="#F5F9FF" stopOpacity="0.95" />
            <Stop offset="75%" stopColor="#EBF3FC" stopOpacity="0.90" />
            <Stop offset="100%" stopColor="#DCE9F5" stopOpacity="0.85" />
          </RadialGradient>

          {/* Shadow gradient - realistic bottom shading */}
          <LinearGradient id={`shadow-${cloud.id}`} x1="50%" y1="35%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor="#B8C8DB" stopOpacity="0" />
            <Stop offset="40%" stopColor="#9AB5D0" stopOpacity="0.12" />
            <Stop offset="70%" stopColor="#7A98B8" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#6B8DB0" stopOpacity="0.28" />
          </LinearGradient>

          {/* Highlight gradient - sun-facing top */}
          <RadialGradient id={`highlight-${cloud.id}`} cx="60%" cy="25%" r="55%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <Stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          
          {/* Secondary highlight for more depth */}
          <RadialGradient id={`highlight2-${cloud.id}`} cx="35%" cy="30%" r="45%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <Stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>

          {/* Inner depth shadow - enhanced */}
          <RadialGradient id={`innerShadow-${cloud.id}`} cx="50%" cy="70%" r="70%">
            <Stop offset="0%" stopColor="#A8BED5" stopOpacity="0" />
            <Stop offset="50%" stopColor="#8AA8C8" stopOpacity="0.10" />
            <Stop offset="80%" stopColor="#6B8DB0" stopOpacity="0.18" />
            <Stop offset="100%" stopColor="#5A7A95" stopOpacity="0.22" />
          </RadialGradient>

          {/* Soft outer glow - lighter */}
          <RadialGradient id={`glow-${cloud.id}`} cx="50%" cy="50%" r="70%">
            <Stop offset="0%" stopColor="#FBFDFF" stopOpacity="0.3" />
            <Stop offset="70%" stopColor="#F5F9FF" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#EEF5FF" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Shadow layers for depth */}
        {cloud.bubbles.map((bubble, i) => (
          <G key={`shadow-${i}`}>
            <Ellipse
              cx={cloud.size * 1.5 + bubble.x + 2}
              cy={cloud.size * 1.2 + bubble.y + 6}
              rx={bubble.rx}
              ry={bubble.ry}
              fill="#1A3A5A"
              opacity="0.08"
            />
            <Ellipse
              cx={cloud.size * 1.5 + bubble.x + 1}
              cy={cloud.size * 1.2 + bubble.y + 3}
              rx={bubble.rx}
              ry={bubble.ry}
              fill="#2A4A6A"
              opacity="0.05"
            />
          </G>
        ))}

        {/* Main cloud bubbles with gradient */}
        {cloud.bubbles.map((bubble, i) => (
          <Ellipse
            key={`main-${i}`}
            cx={cloud.size * 1.5 + bubble.x}
            cy={cloud.size * 1.2 + bubble.y}
            rx={bubble.rx * 1.05}
            ry={bubble.ry * 1.05}
            fill={`url(#mainGrad-${cloud.id})`}
          />
        ))}

        {/* Shadow layer on bubbles */}
        {cloud.bubbles.map((bubble, i) => (
          <G key={`shade-group-${i}`}>
            <Ellipse
              cx={cloud.size * 1.5 + bubble.x}
              cy={cloud.size * 1.2 + bubble.y}
              rx={bubble.rx}
              ry={bubble.ry}
              fill={`url(#shadow-${cloud.id})`}
            />
            <Ellipse
              cx={cloud.size * 1.5 + bubble.x}
              cy={cloud.size * 1.2 + bubble.y}
              rx={bubble.rx}
              ry={bubble.ry}
              fill={`url(#highlight2-${cloud.id})`}
            />
          </G>
        ))}

        {/* Inner shadow for depth */}
        {cloud.bubbles.map((bubble, i) => (
          <Ellipse
            key={`inner-${i}`}
            cx={cloud.size * 1.5 + bubble.x}
            cy={cloud.size * 1.2 + bubble.y}
            rx={bubble.rx}
            ry={bubble.ry}
            fill={`url(#innerShadow-${cloud.id})`}
          />
        ))}

        {/* Highlight on top bubbles */}
        {cloud.bubbles.slice(0, Math.ceil(cloud.bubbles.length * 0.55)).map((bubble, i) => (
          <Ellipse
            key={`highlight-${i}`}
            cx={cloud.size * 1.5 + bubble.x}
            cy={cloud.size * 1.2 + bubble.y}
            rx={bubble.rx * 0.75}
            ry={bubble.ry * 0.65}
            fill={`url(#highlight-${cloud.id})`}
          />
        ))}
        
        {/* Additional bright highlights for dimension */}
        {cloud.bubbles.slice(0, Math.ceil(cloud.bubbles.length * 0.3)).map((bubble, i) => (
          <Ellipse
            key={`bright-${i}`}
            cx={cloud.size * 1.5 + bubble.x - bubble.rx * 0.2}
            cy={cloud.size * 1.2 + bubble.y - bubble.ry * 0.2}
            rx={bubble.rx * 0.4}
            ry={bubble.ry * 0.35}
            fill="#FFFFFF"
            opacity="0.4"
          />
        ))}

        {/* Outer glow for atmosphere */}
        {cloud.bubbles.map((bubble, i) => (
          <Ellipse
            key={`glow-${i}`}
            cx={cloud.size * 1.5 + bubble.x}
            cy={cloud.size * 1.2 + bubble.y}
            rx={bubble.rx * 1.15}
            ry={bubble.ry * 1.15}
            fill={`url(#glow-${cloud.id})`}
            opacity="0.45"
          />
        ))}
        
                {/* Soft blend layer for smooth rounded edges */}
                {cloud.bubbles.map((bubble, i) => (
                  <Ellipse
                    key={`blend-${i}`}
                    cx={cloud.size * 1.5 + bubble.x}
                    cy={cloud.size * 1.2 + bubble.y}
                    rx={bubble.rx * 1.18}
                    ry={bubble.ry * 1.18}
                    fill="#FFFFFF"
                    opacity="0.20"
                  />
                ))}
                
                {/* Soft outer edge for roundness - reduced multiplier to prevent irregular edges */}
                {cloud.bubbles.map((bubble, i) => (
                  <Ellipse
                    key={`soft-blend-${i}`}
                    cx={cloud.size * 1.5 + bubble.x}
                    cy={cloud.size * 1.2 + bubble.y}
                    rx={bubble.rx * 1.25}
                    ry={bubble.ry * 1.25}
                    fill={`url(#glow-${cloud.id})`}
                    opacity="0.22"
                  />
                ))}
      </Svg>
    </Animated.View>
  );
}

// Cloud generation logic moved to CloudAnimationController.tsx and CloudTypes.tsx
// Following Single Responsibility Principle for better maintainability
