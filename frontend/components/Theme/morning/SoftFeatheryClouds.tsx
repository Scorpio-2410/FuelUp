// import React, { useEffect, useRef } from 'react';
// import { View, Animated, Dimensions, StyleSheet } from 'react-native';
// import { Svg, Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg';

// const { width } = Dimensions.get('window');

// const SoftFeatheryClouds: React.FC = () => {
//   const drift = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     // Very slow, gentle drift for atmospheric haze
//     Animated.loop(
//       Animated.timing(drift, {
//         toValue: 1,
//         duration: 200000, // 3+ minutes for very subtle movement
//         useNativeDriver: true,
//       })
//     ).start();
//   }, []);

//   const translateX = drift.interpolate({
//     inputRange: [0, 1],
//     outputRange: [-width * 0.1, width * 0.1], // Very subtle drift
//   });

//   return (
//     <Animated.View style={[styles.container, { transform: [{ translateX }] }]}>
//       <Svg height="400" width={width} style={styles.svg}>
//         <Defs>
//           <RadialGradient id="hazeFill1" cx="50%" cy="50%" r="70%">
//             <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
//             <Stop offset="50%" stopColor="#F8FCFF" stopOpacity="0.3" />
//             <Stop offset="100%" stopColor="#F0F8FF" stopOpacity="0" />
//           </RadialGradient>
//           <RadialGradient id="hazeFill2" cx="50%" cy="50%" r="60%">
//             <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
//             <Stop offset="50%" stopColor="#F8FCFF" stopOpacity="0.25" />
//             <Stop offset="100%" stopColor="#F0F8FF" stopOpacity="0" />
//           </RadialGradient>
//           <RadialGradient id="hazeFill3" cx="50%" cy="50%" r="65%">
//             <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
//             <Stop offset="50%" stopColor="#F8FCFF" stopOpacity="0.28" />
//             <Stop offset="100%" stopColor="#F0F8FF" stopOpacity="0" />
//           </RadialGradient>
//         </Defs>
//         {/* Soft wispy cloud hazes scattered across the sky */}
//         <Ellipse cx={width * 0.2} cy="100" rx="120" ry="60" fill="url(#hazeFill1)" />
//         <Ellipse cx={width * 0.6} cy="140" rx="140" ry="70" fill="url(#hazeFill2)" />
//         <Ellipse cx={width * 0.8} cy="80" rx="100" ry="50" fill="url(#hazeFill3)" />
//         <Ellipse cx={width * 0.4} cy="180" rx="110" ry="55" fill="url(#hazeFill1)" />
//       </Svg>
//     </Animated.View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//   },
//   svg: {
//     opacity: 0.5,
//   },
// });

// export default SoftFeatheryClouds;
