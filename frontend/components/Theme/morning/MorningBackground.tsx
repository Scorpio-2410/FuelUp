//Assembles all morning theme elements into a cohesive sky scene.

import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import SunBloom from "./SunBloom";
// Clouds removed for library selection
import HazeVeil from "./HazeVeil";

export default function MorningBackground({ children }: { children?: React.ReactNode }) {
  return (
    <View style={styles.container}>
      {/* Sky gradient: transitions from soft blue-gray at top to deeper blue at bottom */}
      <LinearGradient
        colors={["#95A8C5","#8CA2BF","#5B81AF","#3A6EA6","#1D66B2","#1A68B8"]}
        locations={[0,0.2,0.4,0.6,0.8,1]}
        start={{x:0.5,y:0}}
        end={{x:0.5,y:1}}
        style={StyleSheet.absoluteFill}
      />

      {/* Atmospheric haze at top for depth */}
      <HazeVeil type="top" />

      {/* Sun with bloom, no animation */}
      <SunBloom size={90} disableAnimation />

      {/* Horizon haze for atmospheric perspective */}
      <HazeVeil type="horizon" />

      {/* Clouds temporarily removed for evaluation */}

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
