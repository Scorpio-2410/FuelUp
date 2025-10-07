import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, View, Easing } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Circle, Rect, LinearGradient as SvgLinear } from "react-native-svg";

const { width, height } = Dimensions.get("window");

export default function Sun({
  x = "18%",
  y = "12%",
  size = 260,
  zIndex = 1,
}: { x?: string; y?: string; size?: number; zIndex?: number }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const bloom = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulse, { toValue: 1.06, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(bloom, { toValue: 1.12, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
    ).start();
  }, []);

  const cx = parseFloat(x) / 100 * width;
  const cy = parseFloat(y) / 100 * height;

  return (
    <View style={{ position: "absolute", left: cx - size*0.5, top: cy - size*0.5, zIndex }}>
      {/* Wide bloom (cool-white → warm tint → transparent) */}
      <Animated.View style={{ transform: [{ scale: bloom }], opacity: 0.55 }}>
        <Svg width={size*2.2} height={size*2.2}>
          <Defs>
            <RadialGradient id="sunBloom" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"  stopColor="#FFFFFF" stopOpacity="0.65" />
              <Stop offset="45%" stopColor="#F6F1E5" stopOpacity="0.35" />
              <Stop offset="100%" stopColor="#E7ECF3" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#sunBloom)" />
        </Svg>
      </Animated.View>

      {/* Core disk */}
      <Animated.View style={{ position: "absolute", left: size*0.6, top: size*0.6, transform: [{ scale: pulse }] }}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="sunCore" cx="50%" cy="50%" r="50%">
              <Stop offset="0%"  stopColor="#FFFFFF" stopOpacity={1} />
              <Stop offset="55%" stopColor="#FFF3C9" stopOpacity={0.95} />
              <Stop offset="85%" stopColor="#FFE8A6" stopOpacity={0.7} />
              <Stop offset="100%" stopColor="#FFE090" stopOpacity={0.45} />
            </RadialGradient>
            {/* slight vertical glare */}
            <SvgLinear id="sunGlare" x1="50%" y1="0%" x2="50%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35"/>
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
