import React from 'react';
import { View } from 'react-native';
import { Svg, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

interface SunBloomProps {
  size?: number;
  opacity?: number;
}

const SunBloom: React.FC<SunBloomProps> = ({ size = 800, opacity = 0.45 }) => {
  return (
    <View style={{ position: 'absolute', left: -300, top: -200, opacity: 0.6 }}>
      <Svg height={size} width={size}>
        <Defs>
          <RadialGradient id="grad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFF7E0" stopOpacity="0.8" />
            <Stop offset="30%" stopColor="#FFECB3" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="rgba(255, 236, 179, 0)" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50%" cy="50%" r="50%" fill="url(#grad)" />
      </Svg>
    </View>
  );
};

export default SunBloom;
