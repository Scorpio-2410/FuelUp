/**
 * Dynamic Cloud System
 * 
 * Generates clouds algorithmically with natural distribution patterns.
 * Uses Poisson disk sampling for realistic cloud placement and organic shapes.
 */

import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View, Easing } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Ellipse, G, RadialGradient, Path } from "react-native-svg";

const { width, height } = Dimensions.get("window");

interface CloudConfig {
  id: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  shape: CloudShape;
  speed: number;
  windOffset: number;
}

type CloudShape = "cumulus" | "stratus" | "cirrus" | "nimbus" | "altocumulus";

interface DynamicCloudSystemProps {
  cloudCount?: number;
  depth: "far" | "mid" | "near";
  baseOpacity?: number;
  baseSpeed?: number;
  tint?: string;
}

export default function DynamicCloudSystem({
  cloudCount = 8,
  depth,
  baseOpacity = 0.6,
  baseSpeed = 0.3,
  tint = "#F8FBFF"
}: DynamicCloudSystemProps) {
  const anim = useRef(new Animated.Value(0)).current;

  // Generate clouds using stratified + Poisson sampling for natural, balanced distribution
  const clouds = useMemo(() => generateNaturalClouds(cloudCount, depth), [cloudCount, depth]);

  // Animation setup
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, { 
        toValue: 1, 
        duration: 60000 / baseSpeed, 
        easing: Easing.linear, 
        useNativeDriver: true 
      })
    ).start();
  }, [baseSpeed]);

  const translateX = anim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [-width * 0.2, width * 0.2] 
  });

  return (
    <Animated.View style={[
      StyleSheet.absoluteFillObject, 
      { 
        transform: [{ translateX }], 
        opacity: baseOpacity,
        zIndex: depth === "near" ? 6 : depth === "mid" ? 5 : 4 
      }
    ]} pointerEvents="none">
      {clouds.map((cloud) => (
        <DynamicCloud key={cloud.id} cloud={cloud} tint={tint} />
      ))}
    </Animated.View>
  );
}

/**
 * Poisson Disk Sampling for Natural Cloud Distribution
 * Ensures clouds are evenly distributed without clustering
 */
function generateNaturalClouds(count: number, depth: string): CloudConfig[] {
  const clouds: CloudConfig[] = [];
  const minDistance = depth === "far" ? 80 : depth === "mid" ? 100 : 120;
  const maxAttempts = 30;

  // Define cloud generation areas based on depth
  const areas = getCloudAreas(depth);

  // Stratify horizontally to avoid left-leaning layouts
  const bands = [
    { x0: 0.0, x1: 0.33 },
    { x0: 0.33, x1: 0.66 },
    { x0: 0.66, x1: 1.0 },
  ];
  const basePerBand = Math.floor(count / 3);
  const remainder = count - basePerBand * 3;
  const perBand = [basePerBand, basePerBand, basePerBand];
  for (let r = 0; r < remainder; r++) perBand[r % 3]++;

  let index = 0;
  for (let b = 0; b < 3; b++) {
    for (let i = 0; i < perBand[b]; i++) {
      let attempts = 0;
      let placed = false;

      while (!placed && attempts < maxAttempts) {
        const area = areas[Math.floor(Math.random() * areas.length)];
        const band = bands[b];
        const x = band.x0 * width + Math.random() * ((band.x1 - band.x0) * width);
        const y = area.y + Math.random() * area.height;

        // Check distance from existing clouds
        const tooClose = clouds.some(existing => {
          const distance = Math.sqrt((x - existing.x) ** 2 + (y - existing.y) ** 2);
          return distance < minDistance;
        });

        if (!tooClose) {
          clouds.push({
            id: `cloud-${depth}-${index}`,
            x,
            y,
            scale: getRandomScale(depth),
            opacity: getRandomOpacity(depth),
            shape: getRandomShape(),
            speed: getRandomSpeed(depth),
            windOffset: Math.random() * 5
          });
          placed = true;
        }
        attempts++;
      }
      index++;
    }
  }

  return clouds;
}

/**
 * Define cloud generation areas for natural distribution
 */
function getCloudAreas(depth: string) {
  const areas = [];
  
  if (depth === "far") {
    // Far clouds: spread across entire screen, more at bottom
    areas.push(
      { x: 0, y: height * 0.1, width: width, height: height * 0.3 }, // Top
      { x: 0, y: height * 0.4, width: width, height: height * 0.4 }, // Middle
      { x: 0, y: height * 0.8, width: width, height: height * 0.2 }  // Bottom
    );
  } else if (depth === "mid") {
    // Mid clouds: balanced distribution
    areas.push(
      { x: 0, y: height * 0.2, width: width, height: height * 0.6 }
    );
  } else {
    // Near clouds: more concentrated, avoid top
    areas.push(
      { x: 0, y: height * 0.3, width: width, height: height * 0.7 }
    );
  }
  
  return areas;
}

/**
 * Generate random cloud properties based on depth
 */
function getRandomScale(depth: string): number {
  const baseScale = depth === "far" ? 0.3 : depth === "mid" ? 0.5 : 0.7;
  return baseScale + (Math.random() - 0.5) * 0.2;
}

function getRandomOpacity(depth: string): number {
  const baseOpacity = depth === "far" ? 0.3 : depth === "mid" ? 0.5 : 0.7;
  return baseOpacity + (Math.random() - 0.5) * 0.2;
}

function getRandomShape(): CloudShape {
  const shapes: CloudShape[] = ["cumulus", "stratus", "cirrus", "nimbus", "altocumulus"];
  return shapes[Math.floor(Math.random() * shapes.length)];
}

function getRandomSpeed(depth: string): number {
  const baseSpeed = depth === "far" ? 0.1 : depth === "mid" ? 0.2 : 0.3;
  return baseSpeed + Math.random() * 0.1;
}

/**
 * Individual Dynamic Cloud Component
 * 
 * Renders organic cloud shapes with natural, flowing edges.
 * Uses advanced SVG paths for realistic cloud formations.
 */
function DynamicCloud({ cloud, tint }: { cloud: CloudConfig; tint: string }) {
  const windAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(windAnim, { 
        toValue: 1, 
        duration: 8000 + Math.random() * 4000, 
        easing: Easing.inOut(Easing.sin), 
        useNativeDriver: true 
      })
    ).start();
  }, []);

  const windSway = windAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, cloud.windOffset, 0]
  });

  const cloudPath = generateCloudPath(cloud.shape, cloud.scale);
  const cloudSize = 200 * cloud.scale;

  return (
    <Animated.View style={{ 
      position: "absolute", 
      left: cloud.x - cloudSize/2, 
      top: cloud.y - cloudSize/2,
      transform: [{ translateY: windSway }]
    }}>
      <Svg width={cloudSize} height={cloudSize}>
        <Defs>
          {/* Main cloud body with enhanced volumetric gradient */}
          <LinearGradient id={`cloudGrad-${cloud.id}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={1.0} />
            <Stop offset="20%" stopColor="#F8FBFF" stopOpacity={0.98} />
            <Stop offset="40%" stopColor={tint} stopOpacity={0.95} />
            <Stop offset="70%" stopColor="#E8F2FF" stopOpacity={0.90} />
            <Stop offset="100%" stopColor="#D1E3F5" stopOpacity={0.85} />
          </LinearGradient>
          
          {/* Enhanced underside shadow for realistic depth */}
          <LinearGradient id={`cloudShade-${cloud.id}`} x1="50%" y1="40%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor="#B8C8DB" stopOpacity={0.0} />
            <Stop offset="50%" stopColor="#8FA8C4" stopOpacity={0.15} />
            <Stop offset="100%" stopColor="#6B8BB0" stopOpacity={0.35} />
          </LinearGradient>

          {/* Multiple highlight layers for realistic lighting */}
          <RadialGradient id={`cloudHighlight-${cloud.id}`} cx="35%" cy="25%" r="70%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.6} />
            <Stop offset="40%" stopColor="#FFFFFF" stopOpacity={0.3} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>

          {/* Secondary highlight for sun-facing side */}
          <RadialGradient id={`cloudHighlight2-${cloud.id}`} cx="60%" cy="20%" r="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>

          {/* Rim light from sun direction (right side) */}
          <LinearGradient id={`cloudRim-${cloud.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="70%" stopColor="#FFFFFF" stopOpacity={0.2} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.5} />
          </LinearGradient>

          {/* Inner shadow for cloud depth */}
          <RadialGradient id={`cloudInner-${cloud.id}`} cx="50%" cy="60%" r="80%">
            <Stop offset="0%" stopColor="#A8BED0" stopOpacity={0.0} />
            <Stop offset="70%" stopColor="#7A9BB8" stopOpacity={0.1} />
            <Stop offset="100%" stopColor="#5A7A95" stopOpacity={0.25} />
          </RadialGradient>

          {/* Soft ambient lighting */}
          <RadialGradient id={`cloudAmbient-${cloud.id}`} cx="50%" cy="50%" r="90%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.1} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <G opacity={cloud.opacity}>
          {/* Enhanced drop shadow with blur effect */}
          <G opacity="0.25">
            <Path d={cloudPath} fill="#3A5A7A" transform={`translate(2, ${cloudSize*0.08})`} />
          </G>
          <G opacity="0.15">
            <Path d={cloudPath} fill="#4A6B8A" transform={`translate(1, ${cloudSize*0.05})`} />
          </G>

          {/* Main cloud body */}
          <Path d={cloudPath} fill={`url(#cloudGrad-${cloud.id})`} />

          {/* Multiple shadow layers for realistic depth */}
          <Path d={cloudPath} fill={`url(#cloudShade-${cloud.id})`} />
          <Path d={cloudPath} fill={`url(#cloudInner-${cloud.id})`} />

          {/* Ambient lighting for overall brightness */}
          <Path d={cloudPath} fill={`url(#cloudAmbient-${cloud.id})`} />

          {/* Primary highlight from sun */}
          <Path d={cloudPath} fill={`url(#cloudHighlight-${cloud.id})`} />

          {/* Secondary highlight for sun-facing side */}
          <Path d={cloudPath} fill={`url(#cloudHighlight2-${cloud.id})`} />

          {/* Rim light from sun direction */}
          <Path d={cloudPath} fill={`url(#cloudRim-${cloud.id})`} />

          {/* Subtle edge definition */}
          <Path 
            d={cloudPath} 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="0.8" 
            strokeOpacity="0.4"
          />
        </G>
      </Svg>
    </Animated.View>
  );
}

/**
 * Generate organic cloud paths based on cloud type
 */
function generateCloudPath(shape: CloudShape, scale: number): string {
  const size = 200 * scale;
  
  switch (shape) {
    case "cumulus":
      return generateCumulusPath(size);
    case "stratus":
      return generateStratusPath(size);
    case "cirrus":
      return generateCirrusPath(size);
    case "nimbus":
      return generateNimbusPath(size);
    case "altocumulus":
      return generateAltocumulusPath(size);
    default:
      return generateCumulusPath(size);
  }
}

/**
 * Cloud shape generators using organic SVG paths
 */
function generateCumulusPath(size: number): string {
  const w = size;
  const h = size * 0.6;
  return `M ${w*0.1} ${h*0.7} 
          Q ${w*0.2} ${h*0.5} ${w*0.3} ${h*0.6}
          Q ${w*0.4} ${h*0.4} ${w*0.5} ${h*0.5}
          Q ${w*0.6} ${h*0.3} ${w*0.7} ${h*0.4}
          Q ${w*0.8} ${h*0.2} ${w*0.9} ${h*0.3}
          Q ${w*0.95} ${h*0.4} ${w*0.9} ${h*0.6}
          Q ${w*0.85} ${h*0.8} ${w*0.7} ${h*0.85}
          Q ${w*0.5} ${h*0.9} ${w*0.3} ${h*0.85}
          Q ${w*0.1} ${h*0.8} ${w*0.1} ${h*0.7} Z`;
}

function generateStratusPath(size: number): string {
  const w = size;
  const h = size * 0.4;
  return `M ${w*0.05} ${h*0.6} 
          Q ${w*0.1} ${h*0.4} ${w*0.2} ${h*0.5}
          Q ${w*0.3} ${h*0.3} ${w*0.4} ${h*0.4}
          Q ${w*0.5} ${h*0.2} ${w*0.6} ${h*0.3}
          Q ${w*0.7} ${h*0.1} ${w*0.8} ${h*0.2}
          Q ${w*0.9} ${h*0.3} ${w*0.95} ${h*0.5}
          Q ${w*0.9} ${h*0.7} ${w*0.8} ${h*0.8}
          Q ${w*0.6} ${h*0.9} ${w*0.4} ${h*0.85}
          Q ${w*0.2} ${h*0.8} ${w*0.05} ${h*0.6} Z`;
}

function generateCirrusPath(size: number): string {
  const w = size;
  const h = size * 0.3;
  return `M ${w*0.1} ${h*0.5} 
          Q ${w*0.2} ${h*0.3} ${w*0.3} ${h*0.4}
          Q ${w*0.4} ${h*0.2} ${w*0.5} ${h*0.3}
          Q ${w*0.6} ${h*0.1} ${w*0.7} ${h*0.2}
          Q ${w*0.8} ${h*0.3} ${w*0.9} ${h*0.4}
          Q ${w*0.85} ${h*0.6} ${w*0.7} ${h*0.7}
          Q ${w*0.5} ${h*0.8} ${w*0.3} ${h*0.75}
          Q ${w*0.1} ${h*0.7} ${w*0.1} ${h*0.5} Z`;
}

function generateNimbusPath(size: number): string {
  const w = size;
  const h = size * 0.8;
  return `M ${w*0.05} ${h*0.8} 
          Q ${w*0.1} ${h*0.6} ${w*0.2} ${h*0.7}
          Q ${w*0.3} ${h*0.5} ${w*0.4} ${h*0.6}
          Q ${w*0.5} ${h*0.4} ${w*0.6} ${h*0.5}
          Q ${w*0.7} ${h*0.3} ${w*0.8} ${h*0.4}
          Q ${w*0.9} ${h*0.5} ${w*0.95} ${h*0.7}
          Q ${w*0.9} ${h*0.9} ${w*0.8} ${h*0.95}
          Q ${w*0.6} ${h*1.0} ${w*0.4} ${h*0.95}
          Q ${w*0.2} ${h*0.9} ${w*0.05} ${h*0.8} Z`;
}

function generateAltocumulusPath(size: number): string {
  const w = size;
  const h = size * 0.5;
  return `M ${w*0.1} ${h*0.6} 
          Q ${w*0.2} ${h*0.4} ${w*0.3} ${h*0.5}
          Q ${w*0.4} ${h*0.3} ${w*0.5} ${h*0.4}
          Q ${w*0.6} ${h*0.2} ${w*0.7} ${h*0.3}
          Q ${w*0.8} ${h*0.4} ${w*0.9} ${h*0.5}
          Q ${w*0.85} ${h*0.7} ${w*0.7} ${h*0.8}
          Q ${w*0.5} ${h*0.9} ${w*0.3} ${h*0.85}
          Q ${w*0.1} ${h*0.8} ${w*0.1} ${h*0.6} Z`;
}
