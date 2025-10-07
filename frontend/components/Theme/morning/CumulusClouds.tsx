import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { Svg, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const CumulusClouds: React.FC = () => {
  const drift1 = useRef(new Animated.Value(0)).current;
  const drift2 = useRef(new Animated.Value(0)).current;
  const drift3 = useRef(new Animated.Value(0)).current;
  const drift4 = useRef(new Animated.Value(0)).current;
  const drift5 = useRef(new Animated.Value(0)).current;
  const drift6 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 30% faster movement - more visible and dynamic
    Animated.loop(
      Animated.timing(drift1, {
        toValue: 1,
        duration: 56000, // 80000 * 0.7 = 30% faster
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(drift2, {
        toValue: 1,
        duration: 70000, // 100000 * 0.7
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(drift3, {
        toValue: 1,
        duration: 84000, // 120000 * 0.7
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(drift4, {
        toValue: 1,
        duration: 63000, // 90000 * 0.7
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(drift5, {
        toValue: 1,
        duration: 77000, // 110000 * 0.7
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(drift6, {
        toValue: 1,
        duration: 91000, // 130000 * 0.7
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX1 = drift1.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.3, width * 0.3], // More visible movement
  });

  const translateX2 = drift2.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.25, width * 0.25],
  });

  const translateX3 = drift3.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.2, width * 0.2],
  });

  const translateX4 = drift4.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.28, width * 0.28],
  });

  const translateX5 = drift5.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.22, width * 0.22],
  });

  const translateX6 = drift6.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.18, width * 0.18],
  });

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Top Left Corner Cloud - Large */}
      <Animated.View style={[styles.cloudLayer, { top: 20, left: -40, opacity: 0.9, transform: [{ translateX: translateX1 }] }]}>
        <Svg height="140" width="280" viewBox="0 0 280 140">
          {/* Shadow layer */}
          <Ellipse cx="72" cy="85" rx="65" ry="42" fill="#C8D9E8" opacity="0.25" />
          <Ellipse cx="112" cy="75" rx="55" ry="38" fill="#C8D9E8" opacity="0.25" />
          <Ellipse cx="152" cy="80" rx="60" ry="40" fill="#C8D9E8" opacity="0.25" />
          <Ellipse cx="187" cy="90" rx="50" ry="35" fill="#C8D9E8" opacity="0.22" />
          {/* Main cloud */}
          <Ellipse cx="70" cy="80" rx="65" ry="42" fill="#FFFFFF" opacity="0.95" />
          <Ellipse cx="110" cy="70" rx="55" ry="38" fill="#FFFFFF" opacity="0.95" />
          <Ellipse cx="150" cy="75" rx="60" ry="40" fill="#FFFFFF" opacity="0.95" />
          <Ellipse cx="185" cy="85" rx="50" ry="35" fill="#FFFFFF" opacity="0.92" />
          <Ellipse cx="105" cy="50" rx="45" ry="32" fill="#FFFFFF" opacity="0.95" />
        </Svg>
      </Animated.View>

      {/* Top Right Corner - Medium Cloud */}
      <Animated.View style={[styles.cloudLayer, { top: 60, right: -20, opacity: 0.85, transform: [{ translateX: translateX2 }] }]}>
        <Svg height="110" width="220" viewBox="0 0 220 110">
          {/* Shadow layer */}
          <Ellipse cx="52" cy="70" rx="48" ry="32" fill="#C8D9E8" opacity="0.22" />
          <Ellipse cx="87" cy="63" rx="42" ry="30" fill="#C8D9E8" opacity="0.22" />
          <Ellipse cx="122" cy="67" rx="50" ry="34" fill="#C8D9E8" opacity="0.2" />
          {/* Main cloud */}
          <Ellipse cx="50" cy="65" rx="48" ry="32" fill="#FFFFFF" opacity="0.92" />
          <Ellipse cx="85" cy="58" rx="42" ry="30" fill="#FFFFFF" opacity="0.92" />
          <Ellipse cx="120" cy="62" rx="50" ry="34" fill="#FFFFFF" opacity="0.9" />
          <Ellipse cx="155" cy="70" rx="40" ry="28" fill="#FFFFFF" opacity="0.88" />
        </Svg>
      </Animated.View>

      {/* Upper Left - Fluffy Cloud */}
      <Animated.View style={[styles.cloudLayer, { top: 140, left: 20, opacity: 0.8, transform: [{ translateX: translateX3 }] }]}>
        <Svg height="100" width="200" viewBox="0 0 200 100">
          {/* Shadow layer */}
          <Ellipse cx="47" cy="65" rx="42" ry="28" fill="#C8D9E8" opacity="0.2" />
          <Ellipse cx="77" cy="57" rx="38" ry="27" fill="#C8D9E8" opacity="0.2" />
          <Ellipse cx="107" cy="63" rx="45" ry="30" fill="#C8D9E8" opacity="0.18" />
          {/* Main cloud */}
          <Ellipse cx="45" cy="60" rx="42" ry="28" fill="#FFFFFF" opacity="0.9" />
          <Ellipse cx="75" cy="52" rx="38" ry="27" fill="#FFFFFF" opacity="0.9" />
          <Ellipse cx="105" cy="58" rx="45" ry="30" fill="#FFFFFF" opacity="0.88" />
          <Ellipse cx="140" cy="65" rx="35" ry="24" fill="#FFFFFF" opacity="0.86" />
        </Svg>
      </Animated.View>

      {/* Middle Right - Large Fluffy */}
      <Animated.View style={[styles.cloudLayer, { top: 220, right: 10, opacity: 0.82, transform: [{ translateX: translateX4 }] }]}>
        <Svg height="120" width="240" viewBox="0 0 240 120">
          {/* Shadow layer */}
          <Ellipse cx="57" cy="75" rx="52" ry="35" fill="#C8D9E8" opacity="0.22" />
          <Ellipse cx="97" cy="67" rx="48" ry="33" fill="#C8D9E8" opacity="0.22" />
          <Ellipse cx="137" cy="73" rx="55" ry="37" fill="#C8D9E8" opacity="0.2" />
          <Ellipse cx="177" cy="80" rx="45" ry="30" fill="#C8D9E8" opacity="0.18" />
          {/* Main cloud */}
          <Ellipse cx="55" cy="70" rx="52" ry="35" fill="#FFFFFF" opacity="0.9" />
          <Ellipse cx="95" cy="62" rx="48" ry="33" fill="#FFFFFF" opacity="0.9" />
          <Ellipse cx="135" cy="68" rx="55" ry="37" fill="#FFFFFF" opacity="0.88" />
          <Ellipse cx="175" cy="75" rx="45" ry="30" fill="#FFFFFF" opacity="0.86" />
          <Ellipse cx="110" cy="45" rx="40" ry="28" fill="#FFFFFF" opacity="0.9" />
        </Svg>
      </Animated.View>

      {/* Center Left - Medium Cloud */}
      <Animated.View style={[styles.cloudLayer, { top: 320, left: -10, opacity: 0.75, transform: [{ translateX: translateX5 }] }]}>
        <Svg height="95" width="190" viewBox="0 0 190 95">
          {/* Shadow layer */}
          <Ellipse cx="47" cy="63" rx="40" ry="27" fill="#C8D9E8" opacity="0.18" />
          <Ellipse cx="82" cy="57" rx="45" ry="30" fill="#C8D9E8" opacity="0.18" />
          <Ellipse cx="117" cy="65" rx="42" ry="28" fill="#C8D9E8" opacity="0.16" />
          {/* Main cloud */}
          <Ellipse cx="45" cy="58" rx="40" ry="27" fill="#FFFFFF" opacity="0.88" />
          <Ellipse cx="80" cy="52" rx="45" ry="30" fill="#FFFFFF" opacity="0.88" />
          <Ellipse cx="115" cy="60" rx="42" ry="28" fill="#FFFFFF" opacity="0.85" />
          <Ellipse cx="145" cy="65" rx="35" ry="24" fill="#FFFFFF" opacity="0.82" />
        </Svg>
      </Animated.View>

      {/* Center - Scattered Small Clouds */}
      <Animated.View style={[styles.cloudLayer, { top: 400, left: width * 0.25, opacity: 0.7, transform: [{ translateX: translateX6 }] }]}>
        <Svg height="80" width="160" viewBox="0 0 160 80">
          {/* Shadow layer */}
          <Ellipse cx="37" cy="53" rx="32" ry="22" fill="#C8D9E8" opacity="0.16" />
          <Ellipse cx="62" cy="47" rx="30" ry="21" fill="#C8D9E8" opacity="0.16" />
          <Ellipse cx="92" cy="55" rx="35" ry="24" fill="#C8D9E8" opacity="0.14" />
          {/* Main cloud */}
          <Ellipse cx="35" cy="48" rx="32" ry="22" fill="#FFFFFF" opacity="0.85" />
          <Ellipse cx="60" cy="42" rx="30" ry="21" fill="#FFFFFF" opacity="0.85" />
          <Ellipse cx="90" cy="50" rx="35" ry="24" fill="#FFFFFF" opacity="0.82" />
          <Ellipse cx="120" cy="55" rx="28" ry="20" fill="#FFFFFF" opacity="0.8" />
        </Svg>
      </Animated.View>

      {/* Lower Right Corner - Medium */}
      <Animated.View style={[styles.cloudLayer, { top: 490, right: 5, opacity: 0.68, transform: [{ translateX: translateX1 }] }]}>
        <Svg height="105" width="210" viewBox="0 0 210 105">
          {/* Shadow layer */}
          <Ellipse cx="50" cy="67" rx="45" ry="30" fill="#C8D9E8" opacity="0.15" />
          <Ellipse cx="87" cy="60" rx="40" ry="28" fill="#C8D9E8" opacity="0.15" />
          <Ellipse cx="122" cy="65" rx="48" ry="32" fill="#C8D9E8" opacity="0.14" />
          {/* Main cloud */}
          <Ellipse cx="48" cy="62" rx="45" ry="30" fill="#FFFFFF" opacity="0.82" />
          <Ellipse cx="85" cy="55" rx="40" ry="28" fill="#FFFFFF" opacity="0.82" />
          <Ellipse cx="120" cy="60" rx="48" ry="32" fill="#FFFFFF" opacity="0.8" />
          <Ellipse cx="155" cy="68" rx="38" ry="26" fill="#FFFFFF" opacity="0.78" />
        </Svg>
      </Animated.View>

      {/* Lower Left - Small Cloud */}
      <Animated.View style={[styles.cloudLayer, { top: 580, left: 15, opacity: 0.65, transform: [{ translateX: translateX3 }] }]}>
        <Svg height="85" width="170" viewBox="0 0 170 85">
          {/* Shadow layer */}
          <Ellipse cx="42" cy="57" rx="38" ry="26" fill="#C8D9E8" opacity="0.14" />
          <Ellipse cx="72" cy="51" rx="35" ry="24" fill="#C8D9E8" opacity="0.14" />
          <Ellipse cx="102" cy="57" rx="40" ry="27" fill="#C8D9E8" opacity="0.12" />
          {/* Main cloud */}
          <Ellipse cx="40" cy="52" rx="38" ry="26" fill="#FFFFFF" opacity="0.8" />
          <Ellipse cx="70" cy="46" rx="35" ry="24" fill="#FFFFFF" opacity="0.8" />
          <Ellipse cx="100" cy="52" rx="40" ry="27" fill="#FFFFFF" opacity="0.78" />
          <Ellipse cx="130" cy="58" rx="32" ry="22" fill="#FFFFFF" opacity="0.75" />
        </Svg>
      </Animated.View>

      {/* Bottom Center - Subtle Cloud */}
      <Animated.View style={[styles.cloudLayer, { top: 660, left: width * 0.3, opacity: 0.6, transform: [{ translateX: translateX4 }] }]}>
        <Svg height="90" width="180" viewBox="0 0 180 90">
          {/* Shadow layer */}
          <Ellipse cx="44" cy="60" rx="40" ry="27" fill="#C8D9E8" opacity="0.12" />
          <Ellipse cx="77" cy="53" rx="38" ry="26" fill="#C8D9E8" opacity="0.12" />
          <Ellipse cx="110" cy="59" rx="42" ry="28" fill="#C8D9E8" opacity="0.11" />
          {/* Main cloud */}
          <Ellipse cx="42" cy="55" rx="40" ry="27" fill="#FFFFFF" opacity="0.78" />
          <Ellipse cx="75" cy="48" rx="38" ry="26" fill="#FFFFFF" opacity="0.78" />
          <Ellipse cx="108" cy="54" rx="42" ry="28" fill="#FFFFFF" opacity="0.75" />
          <Ellipse cx="140" cy="60" rx="35" ry="24" fill="#FFFFFF" opacity="0.72" />
        </Svg>
      </Animated.View>

      {/* Bottom Right Corner - Small */}
      <Animated.View style={[styles.cloudLayer, { top: 730, right: 20, opacity: 0.55, transform: [{ translateX: translateX5 }] }]}>
        <Svg height="75" width="150" viewBox="0 0 150 75">
          {/* Shadow layer */}
          <Ellipse cx="37" cy="50" rx="32" ry="22" fill="#C8D9E8" opacity="0.11" />
          <Ellipse cx="64" cy="45" rx="30" ry="21" fill="#C8D9E8" opacity="0.11" />
          <Ellipse cx="92" cy="51" rx="35" ry="24" fill="#C8D9E8" opacity="0.1" />
          {/* Main cloud */}
          <Ellipse cx="35" cy="45" rx="32" ry="22" fill="#FFFFFF" opacity="0.75" />
          <Ellipse cx="62" cy="40" rx="30" ry="21" fill="#FFFFFF" opacity="0.75" />
          <Ellipse cx="90" cy="46" rx="35" ry="24" fill="#FFFFFF" opacity="0.72" />
          <Ellipse cx="115" cy="50" rx="28" ry="20" fill="#FFFFFF" opacity="0.7" />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  cloudLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});

export default CumulusClouds;
