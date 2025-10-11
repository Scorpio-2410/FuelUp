// Morning Sun Component
// Renders an animated sun with a bright glowing bloom effect.
// Features subtle pulsing animation and radial gradient for realistic lighting.
// Sun size optimized for background visibility - bright but not overwhelming

import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, View, Easing } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Circle, Rect, LinearGradient as SvgLinear } from "react-native-svg";

const { width, height } = Dimensions.get("window");

export default function MorningSun({
  x = "18%",
  y = "8%",   // Moved higher (was 12%, now 8%)
  size = 90,  // 30% smaller than 128 (128 * 0.7 = 89.6 ≈ 90)
  zIndex = 1,
  disableAnimation = true,
}: { x?: string; y?: string; size?: number; zIndex?: number; disableAnimation?: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const bloom = useRef(new Animated.Value(1)).current;

  // Optional pulsing animations for organic feel
  useEffect(() => {
    if (!disableAnimation) {
      Animated.loop(
        Animated.timing(pulse, { toValue: 1.04, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ).start();
      Animated.loop(
        Animated.timing(bloom, { toValue: 1.08, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ).start();
    }
  }, [disableAnimation]);

  const cx = parseFloat(x) / 100 * width;
  const cy = parseFloat(y) / 100 * height;

  return (
    <View style={{ position: "absolute", left: cx - size*0.5, top: cy - size*0.5, zIndex }}>
      {/* Bloom halo - adjusted to blend seamlessly with core (no double edge) */}
      <Animated.View style={{ transform: [{ scale: disableAnimation ? 1 : bloom }], opacity: 0.90 }}>
        <Svg width={size*4.2} height={size*4.2}>
          <Defs>
            <RadialGradient id="sunBloom" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"  stopColor="#FFFFFF" stopOpacity="0.90" />
              <Stop offset="22%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <Stop offset="55%" stopColor="#FFFFFE" stopOpacity="0.42" />
              <Stop offset="100%" stopColor="#E7ECF3" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#sunBloom)" />
        </Svg>
      </Animated.View>

      {/* Brilliant sun core - pure white center */}
      <Animated.View style={{ position: "absolute", left: size*1.6, top: size*1.6, transform: [{ scale: disableAnimation ? 1 : pulse }] }}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="sunCore" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"  stopColor="#FFFFFF" stopOpacity={1} />
              <Stop offset="40%" stopColor="#FFFFFF" stopOpacity={0.98} />
              <Stop offset="75%" stopColor="#FFFFFE" stopOpacity={0.90} />
              <Stop offset="100%" stopColor="#FFF8E5" stopOpacity={0.62} />
            </RadialGradient>
            {/* Intense glare for maximum brightness */}
            <SvgLinear id="sunGlare" x1="50%" y1="0%" x2="50%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.50"/>
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
            </SvgLinear>
          </Defs>
          <Circle cx={size/2} cy={size/2} r={size/2} fill="url(#sunCore)" />
          <Circle cx={size/2} cy={size/2} r={size/2} fill="url(#sunGlare)" />
        </Svg>
      </Animated.View>
    </View>
  );
}
