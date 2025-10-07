import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View, Easing } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Ellipse, G } from "react-native-svg";

const { width, height } = Dimensions.get("window");

type Depth = "far" | "mid" | "near";

interface CloudBankProps {
  depth: Depth;
  speed?: number;
  opacity?: number;
  tint?: string;
}

export default function CloudBank({
  depth,
  speed = 0.25,        // 0.15–0.45 recommended
  opacity = 0.7,
  tint = "#F6FAFF",
}: CloudBankProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const distance = depth === "far" ? width*0.18 : depth === "mid" ? width*0.28 : width*0.36;
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 70000 / speed, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }), // jump back for loop
      ])
    ).start();
  }, [speed]);

  const translateX = anim.interpolate({ inputRange: [0,1], outputRange: [-width*0.25, width*0.25] });

  const scale = depth === "far" ? 0.8 : depth === "mid" ? 1.0 : 1.22;
  const yBase = depth === "far" ? height*0.12 : depth === "mid" ? height*0.22 : height*0.34;

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ translateX }], opacity, zIndex: depth === "near" ? 6 : depth === "mid" ? 5 : 4 }]} pointerEvents="none">
      {/* Compose a few grouped clouds across the width */}
      <Cloud x={width*0.10} y={yBase+0}   scale={scale*0.95} tint={tint} />
      <Cloud x={width*0.55} y={yBase-10}  scale={scale*1.05} tint={tint} />
      <Cloud x={width*0.80} y={yBase+30}  scale={scale*0.9}  tint={tint} />
      {depth !== "far" && (
        <>
          <Cloud x={width*0.28} y={yBase+70}  scale={scale*1.1}  tint={tint} />
          <Cloud x={width*0.68} y={yBase+90}  scale={scale*1.15} tint={tint} />
        </>
      )}
      {depth === "near" && (
        <>
          <Cloud x={width*0.05} y={yBase+140} scale={scale*1.2}  tint={tint} />
          <Cloud x={width*0.78} y={yBase+160} scale={scale*1.25} tint={tint} />
        </>
      )}
    </Animated.View>
  );
}

/** Single cloud with highlight, body gradient, and soft underside shadow */
function Cloud({
  x, y, scale = 1, tint = "#F6FAFF",
}: { x: number; y: number; scale?: number; tint?: string }) {
  const w = 240*scale, h = 120*scale;

  const ids = useMemo(() => ({
    fill: `cloudFill_${Math.random().toString(36).slice(2)}`,
    shade: `cloudShade_${Math.random().toString(36).slice(2)}`,
  }), []);

  return (
    <View style={{ position: "absolute", left: x - w/2, top: y - h/2 }}>
      <Svg width={w} height={h}>
        <Defs>
          {/* body: slightly blue-tinted white, brighter on top */}
          <LinearGradient id={ids.fill} x1="50%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%"  stopColor={tint}       stopOpacity={0.98}/>
            <Stop offset="60%" stopColor="#ECF4FF"    stopOpacity={0.94}/>
            <Stop offset="100%" stopColor="#E2EEFF"   stopOpacity={0.88}/>
          </LinearGradient>
          {/* underside shade toward horizon */}
          <LinearGradient id={ids.shade} x1="50%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%"  stopColor="#AFC6DF" stopOpacity={0}/>
            <Stop offset="100%" stopColor="#6E8BA6" stopOpacity={0.20}/>
          </LinearGradient>
        </Defs>

        {/* soft ambient shadow under the cloud (ground-facing) */}
        <Ellipse cx={w*0.50} cy={h*0.80} rx={w*0.42} ry={h*0.18} fill="#3C5A7A" opacity={0.08} />

        <G>
          {/* build cloud from ellipses; Apple-style shapes are asymmetrical */}
          <Ellipse cx={w*0.30} cy={h*0.58} rx={w*0.28} ry={h*0.22} fill={`url(#${ids.fill})`} />
          <Ellipse cx={w*0.52} cy={h*0.52} rx={w*0.26} ry={h*0.21} fill={`url(#${ids.fill})`} />
          <Ellipse cx={w*0.70} cy={h*0.58} rx={w*0.24} ry={h*0.20} fill={`url(#${ids.fill})`} />
          <Ellipse cx={w*0.45} cy={h*0.40} rx={w*0.22} ry={h*0.18} fill={`url(#${ids.fill})`} />
          {/* underside shade pass */}
          <Ellipse cx={w*0.30} cy={h*0.58} rx={w*0.28} ry={h*0.22} fill={`url(#${ids.shade})`} />
          <Ellipse cx={w*0.52} cy={h*0.52} rx={w*0.26} ry={h*0.21} fill={`url(#${ids.shade})`} />
          <Ellipse cx={w*0.70} cy={h*0.58} rx={w*0.24} ry={h*0.20} fill={`url(#${ids.shade})`} />
        </G>
      </Svg>
    </View>
  );
}
