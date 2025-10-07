import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect, RadialGradient } from "react-native-svg";

interface HazeVeilProps {
  type: "top" | "horizon" | "vignette";
}

export default function HazeVeil({ type }: HazeVeilProps) {
  if (type === "top") {
    return (
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="topHaze" x1="50%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.12}/>
            <Stop offset="35%" stopColor="#FFFFFF" stopOpacity={0.06}/>
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0}/>
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#topHaze)" />
      </Svg>
    );
  }

  if (type === "horizon") {
    return (
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="horizon" cx="50%" cy="65%" r="60%">
            <Stop offset="0%"   stopColor="#EAF3FF" stopOpacity={0.16}/>
            <Stop offset="70%"  stopColor="#EAF3FF" stopOpacity={0.06}/>
            <Stop offset="100%" stopColor="#EAF3FF" stopOpacity={0}/>
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#horizon)" />
      </Svg>
    );
  }

  // vignette
  return (
    <Svg style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="v" cx="50%" cy="55%" r="80%">
          <Stop offset="0%"   stopColor="#000000" stopOpacity={0}/>
          <Stop offset="100%" stopColor="#0B2A55" stopOpacity={0.06}/>
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#v)" />
    </Svg>
  );
}
