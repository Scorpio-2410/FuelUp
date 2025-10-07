import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import SunBloom from "./SunBloom";
import CloudBank from "./CloudBank";
import HazeVeil from "./HazeVeil";

export default function MorningBackground({ children }: { children?: React.ReactNode }) {
  return (
    <View style={styles.container}>
      {/* Sky: hue ~210–216°, saturation increases downward */}
      <LinearGradient
        colors={["#95A8C5","#8CA2BF","#5B81AF","#3A6EA6","#1D66B2","#1A68B8"]}
        locations={[0,0.2,0.4,0.6,0.8,1]}
        start={{x:0.5,y:0}}
        end={{x:0.5,y:1}}
        style={StyleSheet.absoluteFill}
      />

      {/* High-altitude haze near top (thin veil) */}
      <HazeVeil type="top" />

      {/* Sun + bloom (behind most clouds) */}
      <SunBloom size={260} />

      {/* Horizon haze band to push depth */}
      <HazeVeil type="horizon" />

      {/* Cloud banks: far → mid → near (increasing opacity & size) */}
      <CloudBank depth="far"   speed={0.15} opacity={0.55} tint="#F6FAFF" />
      <CloudBank depth="mid"   speed={0.30} opacity={0.70} tint="#F6FAFF" />
      <CloudBank depth="near"  speed={0.45} opacity={0.85} tint="#FFFFFF" />

      {/* Soft edge vignette (very subtle) */}
      <HazeVeil type="vignette" />

      {/* Page content on top */}
      <View style={styles.content} pointerEvents="box-none">{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { flex: 1, zIndex: 10 },
});
