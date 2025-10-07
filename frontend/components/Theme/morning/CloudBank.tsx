//  * Renders animated, realistic cloud layers with depth and parallax scrolling.
//  * Creates volumetric 3D clouds with multiple shapes (fluffy, wispy, cumulus, stretched)
//  * positioned at different depths to simulate atmospheric perspective.

import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View, Easing } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Ellipse, G, RadialGradient } from "react-native-svg";

const { width, height } = Dimensions.get("window");

type Depth = "far" | "mid" | "near";
type CloudShape = "fluffy" | "wispy" | "cumulus" | "stretched";

interface CloudBankProps {
  depth: Depth;
  speed?: number;
  opacity?: number;
  tint?: string;
}

/**
 * Main cloud layer component with parallax animation
 * Renders multiple small clouds distributed evenly for realistic atmosphere
 */
export default function CloudBank({
  depth,
  speed = 0.25,
  opacity = 0.7,
  tint = "#F6FAFF",
}: CloudBankProps) {
  const anim = useRef(new Animated.Value(0)).current;

  // Continuous horizontal drift animation for parallax effect
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 80000 / speed, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [speed]);

  const translateX = anim.interpolate({ inputRange: [0,1], outputRange: [-width*0.3, width*0.3] });

  // More clouds with wind effects - denser and more detailed
  const scale = depth === "far" ? 0.30 : depth === "mid" ? 0.42 : 0.52;

  // Wind effect - subtle swaying motion
  const windOffset = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, depth === "far" ? 3 : depth === "mid" ? 5 : 8, 0]
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { 
      transform: [
        { translateX }, 
        { translateY: windOffset }
      ], 
      opacity, 
      zIndex: depth === "near" ? 6 : depth === "mid" ? 5 : 4 
    }]} pointerEvents="none">
      {/* Balanced cloud distribution - 30% fewer clouds with better design */}
      {depth === "far" && (
        <>
          {/* Top section - minimal coverage */}
          <Cloud x={width*0.25} y={height*0.15} scale={scale*0.85} tint={tint} shape="wispy" />
          <Cloud x={width*0.70} y={height*0.12} scale={scale*0.8}  tint={tint} shape="stretched" />
          {/* Upper middle section */}
          <Cloud x={width*0.15} y={height*0.30} scale={scale*0.9}  tint={tint} shape="fluffy" />
          <Cloud x={width*0.55} y={height*0.28} scale={scale*0.85} tint={tint} shape="cumulus" />
          <Cloud x={width*0.85} y={height*0.32} scale={scale*0.8}  tint={tint} shape="wispy" />
          {/* Lower middle section */}
          <Cloud x={width*0.35} y={height*0.50} scale={scale*0.9}  tint={tint} shape="stretched" />
          <Cloud x={width*0.65} y={height*0.48} scale={scale*0.85} tint={tint} shape="fluffy" />
          {/* Bottom section - near navbar */}
          <Cloud x={width*0.20} y={height*0.70} scale={scale*0.95} tint={tint} shape="cumulus" />
          <Cloud x={width*0.50} y={height*0.75} scale={scale*0.9}  tint={tint} shape="wispy" />
          <Cloud x={width*0.80} y={height*0.72} scale={scale*0.85} tint={tint} shape="stretched" />
        </>
      )}
      {depth === "mid" && (
        <>
          {/* Top section - minimal coverage */}
          <Cloud x={width*0.40} y={height*0.18} scale={scale*0.9}  tint={tint} shape="fluffy" />
          <Cloud x={width*0.75} y={height*0.15} scale={scale*0.85} tint={tint} shape="wispy" />
          {/* Upper middle section */}
          <Cloud x={width*0.10} y={height*0.35} scale={scale*0.95} tint={tint} shape="stretched" />
          <Cloud x={width*0.45} y={height*0.38} scale={scale*0.9}  tint={tint} shape="cumulus" />
          <Cloud x={width*0.80} y={height*0.40} scale={scale*0.85} tint={tint} shape="fluffy" />
          {/* Lower middle section */}
          <Cloud x={width*0.25} y={height*0.55} scale={scale*1.0}  tint={tint} shape="wispy" />
          <Cloud x={width*0.60} y={height*0.58} scale={scale*0.95} tint={tint} shape="stretched" />
          {/* Bottom section - near navbar */}
          <Cloud x={width*0.15} y={height*0.75} scale={scale*1.05} tint={tint} shape="cumulus" />
          <Cloud x={width*0.50} y={height*0.78} scale={scale*1.0}  tint={tint} shape="fluffy" />
          <Cloud x={width*0.85} y={height*0.80} scale={scale*0.95} tint={tint} shape="wispy" />
        </>
      )}
      {depth === "near" && (
        <>
          {/* Top section - minimal coverage */}
          <Cloud x={width*0.30} y={height*0.22} scale={scale*1.0}  tint={tint} shape="wispy" />
          <Cloud x={width*0.65} y={height*0.20} scale={scale*0.95} tint={tint} shape="fluffy" />
          {/* Upper middle section */}
          <Cloud x={width*0.12} y={height*0.42} scale={scale*1.05} tint={tint} shape="stretched" />
          <Cloud x={width*0.50} y={height*0.45} scale={scale*1.1}  tint={tint} shape="cumulus" />
          <Cloud x={width*0.82} y={height*0.48} scale={scale*1.0}  tint={tint} shape="fluffy" />
          {/* Lower middle section */}
          <Cloud x={width*0.25} y={height*0.65} scale={scale*1.1}  tint={tint} shape="wispy" />
          <Cloud x={width*0.60} y={height*0.68} scale={scale*1.05} tint={tint} shape="stretched" />
          {/* Bottom section - near navbar */}
          <Cloud x={width*0.18} y={height*0.82} scale={scale*1.15} tint={tint} shape="cumulus" />
          <Cloud x={width*0.45} y={height*0.85} scale={scale*1.1}  tint={tint} shape="fluffy" />
          <Cloud x={width*0.75} y={height*0.88} scale={scale*1.05} tint={tint} shape="wispy" />
        </>
      )}
    </Animated.View>
  );
}

/**
 * Individual Cloud Component with Wind Effects
 * 
 * Renders a single volumetric cloud with realistic 3D shading, highlights, and wind animation.
 * Uses multiple ellipse "puffs" to create natural, organic cloud shapes with subtle movement.
 */
function Cloud({
  x, y, scale = 1, tint = "#F6FAFF", shape = "fluffy"
}: { x: number; y: number; scale?: number; tint?: string; shape?: CloudShape }) {
  const w = 320*scale, h = 160*scale; // Slightly larger for more detail

  // Wind animation for individual cloud
  const windAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(windAnim, { 
        toValue: 1, 
        duration: 12000 + Math.random() * 8000, // Varying wind speeds
        easing: Easing.inOut(Easing.sin), 
        useNativeDriver: true 
      })
    ).start();
  }, []);

  // Wind sway effect
  const windSway = windAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 2 + Math.random() * 3, 0]
  });

  // Generate unique gradient IDs to avoid SVG conflicts
  const ids = useMemo(() => ({
    fill: `cloudFill_${Math.random().toString(36).slice(2)}`,
    shade: `cloudShade_${Math.random().toString(36).slice(2)}`,
    highlight: `cloudHighlight_${Math.random().toString(36).slice(2)}`,
    volume: `cloudVolume_${Math.random().toString(36).slice(2)}`,
    wind: `cloudWind_${Math.random().toString(36).slice(2)}`,
  }), []);

  // Improved cloud puffs with better realism and distribution
  const getCloudPuffs = () => {
    switch (shape) {
      case "fluffy":
        // Soft, rounded clouds with natural clustering
        return [
          { cx: 0.25, cy: 0.68, rx: 0.24, ry: 0.28 },
          { cx: 0.45, cy: 0.62, rx: 0.28, ry: 0.32 },
          { cx: 0.65, cy: 0.66, rx: 0.26, ry: 0.30 },
          { cx: 0.80, cy: 0.70, rx: 0.22, ry: 0.26 },
          { cx: 0.35, cy: 0.45, rx: 0.20, ry: 0.24 },
          { cx: 0.60, cy: 0.48, rx: 0.24, ry: 0.26 },
          { cx: 0.50, cy: 0.30, rx: 0.18, ry: 0.22 },
        ];
      case "cumulus":
        // Billowing clouds with realistic tower structure
        return [
          { cx: 0.30, cy: 0.70, rx: 0.30, ry: 0.35 },
          { cx: 0.50, cy: 0.65, rx: 0.34, ry: 0.38 },
          { cx: 0.70, cy: 0.68, rx: 0.28, ry: 0.32 },
          { cx: 0.40, cy: 0.45, rx: 0.26, ry: 0.30 },
          { cx: 0.60, cy: 0.42, rx: 0.24, ry: 0.28 },
          { cx: 0.50, cy: 0.25, rx: 0.20, ry: 0.24 },
          { cx: 0.35, cy: 0.35, rx: 0.22, ry: 0.26 },
          { cx: 0.65, cy: 0.38, rx: 0.20, ry: 0.24 },
        ];
      case "wispy":
        // Delicate, feathery clouds with natural flow
        return [
          { cx: 0.20, cy: 0.60, rx: 0.38, ry: 0.22 },
          { cx: 0.45, cy: 0.58, rx: 0.42, ry: 0.24 },
          { cx: 0.70, cy: 0.62, rx: 0.35, ry: 0.20 },
          { cx: 0.85, cy: 0.65, rx: 0.30, ry: 0.18 },
          { cx: 0.35, cy: 0.45, rx: 0.32, ry: 0.20 },
          { cx: 0.65, cy: 0.48, rx: 0.34, ry: 0.22 },
          { cx: 0.50, cy: 0.35, rx: 0.28, ry: 0.18 },
        ];
      case "stretched":
        // Horizontal clouds with smooth elongation
        return [
          { cx: 0.20, cy: 0.65, rx: 0.30, ry: 0.28 },
          { cx: 0.45, cy: 0.62, rx: 0.34, ry: 0.30 },
          { cx: 0.70, cy: 0.66, rx: 0.32, ry: 0.29 },
          { cx: 0.85, cy: 0.68, rx: 0.28, ry: 0.26 },
          { cx: 0.30, cy: 0.45, rx: 0.26, ry: 0.24 },
          { cx: 0.55, cy: 0.48, rx: 0.30, ry: 0.27 },
          { cx: 0.75, cy: 0.45, rx: 0.28, ry: 0.25 },
        ];
      default:
        return [];
    }
  };

  const puffs = getCloudPuffs();

  return (
    <Animated.View style={{ 
      position: "absolute", 
      left: x - w/2, 
      top: y - h/2,
      transform: [{ translateY: windSway }]
    }}>
      <Svg width={w} height={h}>
        <Defs>
          {/* Enhanced volumetric body gradient with wind effects */}
          <LinearGradient id={ids.fill} x1="50%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%"  stopColor="#FFFFFF"    stopOpacity={1.0}/>
            <Stop offset="20%" stopColor={tint}       stopOpacity={0.99}/>
            <Stop offset="45%" stopColor="#F0F6FF"    stopOpacity={0.97}/>
            <Stop offset="70%" stopColor="#E8F2FF"    stopOpacity={0.95}/>
            <Stop offset="100%" stopColor="#DCE9F8"   stopOpacity={0.92}/>
          </LinearGradient>
          
          {/* Enhanced shadow gradient for more depth */}
          <LinearGradient id={ids.shade} x1="50%" y1="20%" x2="50%" y2="100%">
            <Stop offset="0%"  stopColor="#C5D8EB" stopOpacity={0}/>
            <Stop offset="50%" stopColor="#A8C4E0" stopOpacity={0.15}/>
            <Stop offset="100%" stopColor="#8AADCA" stopOpacity={0.25}/>
          </LinearGradient>

          {/* Brighter highlight for sun-facing side with wind direction */}
          <RadialGradient id={ids.highlight} cx="35%" cy="25%" r="70%">
            <Stop offset="0%"  stopColor="#FFFFFF" stopOpacity={0.6}/>
            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.3}/>
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0}/>
          </RadialGradient>

          {/* Enhanced volumetric lighting for 3D effect */}
          <RadialGradient id={ids.volume} cx="50%" cy="40%" r="65%">
            <Stop offset="0%"  stopColor="#FFFFFF" stopOpacity={0.25}/>
            <Stop offset="70%" stopColor="#FFFFFF" stopOpacity={0.1}/>
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0}/>
          </RadialGradient>

          {/* Wind effect gradient for subtle movement */}
          <LinearGradient id={ids.wind} x1="0%" y1="50%" x2="100%" y2="50%">
            <Stop offset="0%"  stopColor="#FFFFFF" stopOpacity={0}/>
            <Stop offset="30%" stopColor="#FFFFFF" stopOpacity={0.1}/>
            <Stop offset="70%" stopColor="#FFFFFF" stopOpacity={0.1}/>
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0}/>
          </LinearGradient>
        </Defs>

        {/* Enhanced shadow beneath cloud with wind effect */}
        <Ellipse cx={w*0.50} cy={h*0.88} rx={w*0.42} ry={h*0.18} fill="#4A6B8A" opacity={0.08} />

        <G>
          {/* Render all puffs with enhanced body gradient */}
          {puffs.map((puff, i) => (
            <Ellipse 
              key={`body-${i}`}
              cx={w * puff.cx} 
              cy={h * puff.cy} 
              rx={w * puff.rx} 
              ry={h * puff.ry} 
              fill={`url(#${ids.fill})`} 
            />
          ))}

          {/* Enhanced shadow pass for better depth */}
          {puffs.map((puff, i) => (
            <Ellipse 
              key={`shade-${i}`}
              cx={w * puff.cx} 
              cy={h * puff.cy} 
              rx={w * puff.rx} 
              ry={h * puff.ry} 
              fill={`url(#${ids.shade})`} 
            />
          ))}

          {/* Multiple volumetric lighting overlays for depth */}
          <Ellipse cx={w*0.50} cy={h*0.45} rx={w*0.45} ry={h*0.40} fill={`url(#${ids.volume})`} />
          <Ellipse cx={w*0.35} cy={h*0.50} rx={w*0.30} ry={h*0.25} fill={`url(#${ids.volume})`} />
          <Ellipse cx={w*0.65} cy={h*0.48} rx={w*0.28} ry={h*0.22} fill={`url(#${ids.volume})`} />

          {/* Enhanced highlight pass for realism - sun from right with wind */}
          {puffs.slice(0, Math.ceil(puffs.length * 0.7)).map((puff, i) => (
            <Ellipse 
              key={`highlight-${i}`}
              cx={w * (puff.cx + 0.03)} 
              cy={h * (puff.cy - 0.08)} 
              rx={w * puff.rx * 0.8} 
              ry={h * puff.ry * 0.7} 
              fill={`url(#${ids.highlight})`} 
            />
          ))}

          {/* Wind effect overlay for subtle movement */}
          <Ellipse cx={w*0.50} cy={h*0.50} rx={w*0.50} ry={h*0.30} fill={`url(#${ids.wind})`} />
        </G>
      </Svg>
    </Animated.View>
  );
}
