/**
 * Advanced Cloud System with Realistic 3D Rendering
 * 
 * Uses sophisticated shading techniques and organic cloud generation
 * for photorealistic cloud formations with proper depth and lighting.
 */

import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View, Easing } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Ellipse, G, RadialGradient, Path, Filter, FeGaussianBlur } from "react-native-svg";

const { width, height } = Dimensions.get("window");

interface AdvancedCloudConfig {
  id: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  shape: CloudType;
  speed: number;
  windOffset: number;
  depth: number;
}

type CloudType = "cumulus" | "stratus" | "cirrus" | "nimbus" | "altocumulus" | "lenticular";

interface AdvancedCloudSystemProps {
  cloudCount?: number;
  depth: "far" | "mid" | "near";
  baseOpacity?: number;
  baseSpeed?: number;
  tint?: string;
}

export default function AdvancedCloudSystem({
  cloudCount = 8,
  depth,
  baseOpacity = 0.6,
  baseSpeed = 0.3,
  tint = "#F8FBFF"
}: AdvancedCloudSystemProps) {
  const anim = useRef(new Animated.Value(0)).current;

  // Generate clouds with advanced distribution
  const clouds = useMemo(() => generateAdvancedClouds(cloudCount, depth), [cloudCount, depth]);

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
        <AdvancedCloud key={cloud.id} cloud={cloud} tint={tint} />
      ))}
    </Animated.View>
  );
}

/**
 * Advanced cloud generation with realistic distribution
 */
function generateAdvancedClouds(count: number, depth: string): AdvancedCloudConfig[] {
  const clouds: AdvancedCloudConfig[] = [];
  const minDistance = depth === "far" ? 100 : depth === "mid" ? 120 : 140;
  const maxAttempts = 50;
  
  // Balanced horizontal distribution
  const bands = [
    { x0: 0.0, x1: 0.33 },
    { x0: 0.33, x1: 0.66 },
    { x0: 0.66, x1: 1.0 },
  ];
  const basePerBand = Math.floor(count / 3);
  const remainder = count - basePerBand * 3;
  const perBand = [basePerBand, basePerBand, basePerBand];
  for (let r = 0; r < remainder; r++) perBand[r % 3]++;

  // Define vertical areas based on depth
  const areas = getAdvancedCloudAreas(depth);
  
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
            id: `advanced-cloud-${depth}-${index}`,
            x,
            y,
            scale: getAdvancedScale(depth),
            opacity: getAdvancedOpacity(depth),
            shape: getAdvancedShape(),
            speed: getAdvancedSpeed(depth),
            windOffset: Math.random() * 8,
            depth: depth === "far" ? 0.3 : depth === "mid" ? 0.6 : 0.9
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

function getAdvancedCloudAreas(depth: string) {
  const areas = [];
  
  if (depth === "far") {
    areas.push(
      { x: 0, y: height * 0.1, width: width, height: height * 0.4 },
      { x: 0, y: height * 0.5, width: width, height: height * 0.5 }
    );
  } else if (depth === "mid") {
    areas.push(
      { x: 0, y: height * 0.2, width: width, height: height * 0.6 }
    );
  } else {
    areas.push(
      { x: 0, y: height * 0.3, width: width, height: height * 0.7 }
    );
  }
  
  return areas;
}

function getAdvancedScale(depth: string): number {
  const baseScale = depth === "far" ? 0.4 : depth === "mid" ? 0.6 : 0.8;
  return baseScale + (Math.random() - 0.5) * 0.3;
}

function getAdvancedOpacity(depth: string): number {
  const baseOpacity = depth === "far" ? 0.4 : depth === "mid" ? 0.6 : 0.8;
  return baseOpacity + (Math.random() - 0.5) * 0.2;
}

function getAdvancedShape(): CloudType {
  const shapes: CloudType[] = ["cumulus", "stratus", "cirrus", "nimbus", "altocumulus", "lenticular"];
  return shapes[Math.floor(Math.random() * shapes.length)];
}

function getAdvancedSpeed(depth: string): number {
  const baseSpeed = depth === "far" ? 0.1 : depth === "mid" ? 0.2 : 0.3;
  return baseSpeed + Math.random() * 0.15;
}

/**
 * Advanced Cloud Component with Photorealistic Rendering
 */
function AdvancedCloud({ cloud, tint }: { cloud: AdvancedCloudConfig; tint: string }) {
  const windAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(windAnim, { 
        toValue: 1, 
        duration: 10000 + Math.random() * 6000, 
        easing: Easing.inOut(Easing.sin), 
        useNativeDriver: true 
      })
    ).start();
  }, []);

  const windSway = windAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, cloud.windOffset, 0]
  });

  const cloudPath = generateAdvancedCloudPath(cloud.shape, cloud.scale);
  const cloudSize = 250 * cloud.scale;

  return (
    <Animated.View style={{ 
      position: "absolute", 
      left: cloud.x - cloudSize/2, 
      top: cloud.y - cloudSize/2,
      transform: [{ translateY: windSway }]
    }}>
      <Svg width={cloudSize} height={cloudSize}>
        <Defs>
          {/* Blur filter for soft edges */}
          <Filter id={`blur-${cloud.id}`}>
            <FeGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
          </Filter>

          {/* Main volumetric gradient */}
          <LinearGradient id={`mainGrad-${cloud.id}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={1.0} />
            <Stop offset="25%" stopColor="#F8FBFF" stopOpacity={0.98} />
            <Stop offset="50%" stopColor={tint} stopOpacity={0.95} />
            <Stop offset="75%" stopColor="#E8F2FF" stopOpacity={0.90} />
            <Stop offset="100%" stopColor="#D1E3F5" stopOpacity={0.85} />
          </LinearGradient>

          {/* Deep shadow gradient */}
          <LinearGradient id={`shadowGrad-${cloud.id}`} x1="50%" y1="30%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor="#9BB5CC" stopOpacity={0.0} />
            <Stop offset="40%" stopColor="#7A9BB8" stopOpacity={0.2} />
            <Stop offset="80%" stopColor="#5A7A95" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#3A5A7A" stopOpacity={0.6} />
          </LinearGradient>

          {/* Multiple highlight layers */}
          <RadialGradient id={`highlight1-${cloud.id}`} cx="30%" cy="20%" r="60%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.8} />
            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>

          <RadialGradient id={`highlight2-${cloud.id}`} cx="65%" cy="15%" r="45%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.6} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>

          {/* Rim lighting */}
          <LinearGradient id={`rimLight-${cloud.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="60%" stopColor="#FFFFFF" stopOpacity={0.3} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.7} />
          </LinearGradient>

          {/* Inner depth shadow */}
          <RadialGradient id={`innerShadow-${cloud.id}`} cx="50%" cy="70%" r="70%">
            <Stop offset="0%" stopColor="#A8BED0" stopOpacity={0.0} />
            <Stop offset="60%" stopColor="#7A9BB8" stopOpacity={0.15} />
            <Stop offset="100%" stopColor="#4A6B8A" stopOpacity={0.3} />
          </RadialGradient>

          {/* Ambient occlusion */}
          <RadialGradient id={`ambient-${cloud.id}`} cx="50%" cy="50%" r="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.05} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <G opacity={cloud.opacity}>
          {/* Multiple drop shadows for depth */}
          <G opacity="0.3" filter={`url(#blur-${cloud.id})`}>
            <Path d={cloudPath} fill="#2A4A6A" transform={`translate(3, ${cloudSize*0.1})`} />
          </G>
          <G opacity="0.2" filter={`url(#blur-${cloud.id})`}>
            <Path d={cloudPath} fill="#3A5A7A" transform={`translate(2, ${cloudSize*0.07})`} />
          </G>
          <G opacity="0.15">
            <Path d={cloudPath} fill="#4A6B8A" transform={`translate(1, ${cloudSize*0.04})`} />
          </G>

          {/* Main cloud body */}
          <Path d={cloudPath} fill={`url(#mainGrad-${cloud.id})`} />

          {/* Shadow layers */}
          <Path d={cloudPath} fill={`url(#shadowGrad-${cloud.id})`} />
          <Path d={cloudPath} fill={`url(#innerShadow-${cloud.id})`} />

          {/* Ambient lighting */}
          <Path d={cloudPath} fill={`url(#ambient-${cloud.id})`} />

          {/* Highlight layers */}
          <Path d={cloudPath} fill={`url(#highlight1-${cloud.id})`} />
          <Path d={cloudPath} fill={`url(#highlight2-${cloud.id})`} />

          {/* Rim lighting */}
          <Path d={cloudPath} fill={`url(#rimLight-${cloud.id})`} />

          {/* Subtle edge definition */}
          <Path 
            d={cloudPath} 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="1.2" 
            strokeOpacity="0.5"
            filter={`url(#blur-${cloud.id})`}
          />
        </G>
      </Svg>
    </Animated.View>
  );
}

/**
 * Generate advanced cloud paths with more organic shapes
 */
function generateAdvancedCloudPath(shape: CloudType, scale: number): string {
  const size = 250 * scale;
  
  switch (shape) {
    case "cumulus":
      return generateAdvancedCumulusPath(size);
    case "stratus":
      return generateAdvancedStratusPath(size);
    case "cirrus":
      return generateAdvancedCirrusPath(size);
    case "nimbus":
      return generateAdvancedNimbusPath(size);
    case "altocumulus":
      return generateAdvancedAltocumulusPath(size);
    case "lenticular":
      return generateAdvancedLenticularPath(size);
    default:
      return generateAdvancedCumulusPath(size);
  }
}

function generateAdvancedCumulusPath(size: number): string {
  const w = size;
  const h = size * 0.7;
  return `M ${w*0.05} ${h*0.8} 
          Q ${w*0.15} ${h*0.6} ${w*0.25} ${h*0.7}
          Q ${w*0.35} ${h*0.5} ${w*0.45} ${h*0.6}
          Q ${w*0.55} ${h*0.4} ${w*0.65} ${h*0.5}
          Q ${w*0.75} ${h*0.3} ${w*0.85} ${h*0.4}
          Q ${w*0.95} ${h*0.5} ${w*0.9} ${h*0.7}
          Q ${w*0.85} ${h*0.9} ${w*0.7} ${h*0.95}
          Q ${w*0.5} ${h*1.0} ${w*0.3} ${h*0.95}
          Q ${w*0.1} ${h*0.9} ${w*0.05} ${h*0.8} Z`;
}

function generateAdvancedStratusPath(size: number): string {
  const w = size;
  const h = size * 0.5;
  return `M ${w*0.02} ${h*0.7} 
          Q ${w*0.08} ${h*0.5} ${w*0.18} ${h*0.6}
          Q ${w*0.28} ${h*0.4} ${w*0.38} ${h*0.5}
          Q ${w*0.48} ${h*0.3} ${w*0.58} ${h*0.4}
          Q ${w*0.68} ${h*0.2} ${w*0.78} ${h*0.3}
          Q ${w*0.88} ${h*0.4} ${w*0.98} ${h*0.6}
          Q ${w*0.92} ${h*0.8} ${w*0.82} ${h*0.9}
          Q ${w*0.62} ${h*1.0} ${w*0.42} ${h*0.95}
          Q ${w*0.22} ${h*0.9} ${w*0.02} ${h*0.7} Z`;
}

function generateAdvancedCirrusPath(size: number): string {
  const w = size;
  const h = size * 0.4;
  return `M ${w*0.05} ${h*0.6} 
          Q ${w*0.15} ${h*0.4} ${w*0.25} ${h*0.5}
          Q ${w*0.35} ${h*0.3} ${w*0.45} ${h*0.4}
          Q ${w*0.55} ${h*0.2} ${w*0.65} ${h*0.3}
          Q ${w*0.75} ${h*0.4} ${w*0.85} ${h*0.5}
          Q ${w*0.8} ${h*0.7} ${w*0.7} ${h*0.8}
          Q ${w*0.5} ${h*0.9} ${w*0.3} ${h*0.85}
          Q ${w*0.1} ${h*0.8} ${w*0.05} ${h*0.6} Z`;
}

function generateAdvancedNimbusPath(size: number): string {
  const w = size;
  const h = size * 0.9;
  return `M ${w*0.02} ${h*0.9} 
          Q ${w*0.08} ${h*0.7} ${w*0.18} ${h*0.8}
          Q ${w*0.28} ${h*0.6} ${w*0.38} ${h*0.7}
          Q ${w*0.48} ${h*0.5} ${w*0.58} ${h*0.6}
          Q ${w*0.68} ${h*0.4} ${w*0.78} ${h*0.5}
          Q ${w*0.88} ${h*0.6} ${w*0.98} ${h*0.8}
          Q ${w*0.92} ${h*1.0} ${w*0.82} ${h*1.05}
          Q ${w*0.62} ${h*1.1} ${w*0.42} ${h*1.05}
          Q ${w*0.22} ${h*1.0} ${w*0.02} ${h*0.9} Z`;
}

function generateAdvancedAltocumulusPath(size: number): string {
  const w = size;
  const h = size * 0.6;
  return `M ${w*0.05} ${h*0.7} 
          Q ${w*0.15} ${h*0.5} ${w*0.25} ${h*0.6}
          Q ${w*0.35} ${h*0.4} ${w*0.45} ${h*0.5}
          Q ${w*0.55} ${h*0.3} ${w*0.65} ${h*0.4}
          Q ${w*0.75} ${h*0.5} ${w*0.85} ${h*0.6}
          Q ${w*0.8} ${h*0.8} ${w*0.7} ${h*0.9}
          Q ${w*0.5} ${h*1.0} ${w*0.3} ${h*0.95}
          Q ${w*0.1} ${h*0.9} ${w*0.05} ${h*0.7} Z`;
}

function generateAdvancedLenticularPath(size: number): string {
  const w = size;
  const h = size * 0.3;
  return `M ${w*0.1} ${h*0.5} 
          Q ${w*0.2} ${h*0.3} ${w*0.3} ${h*0.4}
          Q ${w*0.4} ${h*0.2} ${w*0.5} ${h*0.3}
          Q ${w*0.6} ${h*0.1} ${w*0.7} ${h*0.2}
          Q ${w*0.8} ${h*0.3} ${w*0.9} ${h*0.5}
          Q ${w*0.85} ${h*0.7} ${w*0.75} ${h*0.8}
          Q ${w*0.55} ${h*0.9} ${w*0.35} ${h*0.85}
          Q ${w*0.15} ${h*0.8} ${w*0.1} ${h*0.5} Z`;
}
