// app/(tabs)/homepage.tsx
import React, { useState, useCallback, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Dimensions, Image } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedScrollHandler,
  withTiming,
  withRepeat,
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function HomePageScreen() {
  const currentDate = new Date();
  const monthName = "August";
  const year = "2025";
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  
  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [stepCount, setStepCount] = useState(954);
  const [burnedCalories, setBurnedCalories] = useState(400);
  const [quote, setQuote] = useState("give up bro");
  const [goalMessage, setGoalMessage] = useState("you r almost there! keep it up");
  
  // Facebook-style pull-to-refresh values
  const scrollY = useSharedValue(0);
  const pullDistance = useSharedValue(0);
  const spinRotation = useSharedValue(0);
  const lastVelocity = useSharedValue(0);
  const refreshThreshold = 130; // Distance to trigger refresh (perfect balance)
  
  // Spinning animation for refresh icon
  useEffect(() => {
    if (refreshing) {
      spinRotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1, // infinite
        false
      );
    } else {
      spinRotation.value = 0;
    }
  }, [refreshing]);
  
  // Facebook-style refresh function
  const triggerRefresh = useCallback(() => {
    if (refreshing) return;
    
    setRefreshing(true);
    
    // Simulate refreshing data
    setTimeout(() => {
      // Update data with "new" values
      setStepCount(Math.floor(Math.random() * 2000) + 500);
      setBurnedCalories(Math.floor(Math.random() * 600) + 200);
      
      // Update motivational content
      const quotes = [
        "give up bro", 
        "you dont got this!", 
        "keep crying", 
        "stay negative!", 
        "almost there! loser",
        "one more step! loser",
        "never give up! you are a loser!"
      ];
      const goals = [
        "you r almost there! keep it up loser",
        "great progress today! loser",
        "you're on fire! 🔥 loser",
        "crushing your goals! loser",
        "keep the momentum! loser",
        "excellent work! loser",
        "you're unstoppable! loser",
        "amazing effort! loser"
      ];
      
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      setGoalMessage(goals[Math.floor(Math.random() * goals.length)]);
      
      setRefreshing(false);
      pullDistance.value = withTiming(0, { duration: 300 });
    }, 2000);
  }, [refreshing]);

  // Scroll handler for Facebook-style pull-to-refresh
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      lastVelocity.value = event.velocity ? event.velocity.y : 0;
      
      // Only track pull distance when at the top
      if (event.contentOffset.y <= 0) {
        const currentPull = Math.abs(event.contentOffset.y);
        pullDistance.value = currentPull;
        
        // Trigger refresh only if:
        // 1. Pulled far enough (130px)
        // 2. Not already refreshing
        if (currentPull > refreshThreshold && !refreshing) {
          runOnJS(triggerRefresh)();
        }
      } else {
        pullDistance.value = 0;
      }
    },
  });
  
  // hardcoded dates
  const calendarDays = [
    { day: "M", date: "18" },
    { day: "T", date: "19" },
    { day: "W", date: "20", isToday: true },
    { day: "T", date: "21" },
    { day: "F", date: "22" },
    { day: "S", date: "23" },
    { day: "S", date: "24" },
  ];

  // Animated styles for the refresh indicator
  const refreshIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      pullDistance.value,
      [0, refreshThreshold * 0.4, refreshThreshold],
      [0, 0.3, 1]
    );
    
    const translateY = interpolate(
      pullDistance.value,
      [0, refreshThreshold],
      [-50, 0]
    );
    
    const rotation = refreshing 
      ? spinRotation.value 
      : interpolate(
          pullDistance.value,
          [0, refreshThreshold],
          [0, 180]
        );

    return {
      opacity,
      transform: [
        { translateY },
        { rotate: `${rotation}deg` }
      ]
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      {/* Facebook-style refresh indicator */}
      <Animated.View 
        style={[
          {
            position: 'absolute',
            top: insets.top + 20,
            left: '50%',
            marginLeft: -15,
            zIndex: 1000,
            width: 30,
            height: 30,
            backgroundColor: '#2a2a2a',
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
          },
          refreshIndicatorStyle
        ]}
      >
        {refreshing ? (
          <FontAwesome name="spinner" size={16} color="#bbf246" />
        ) : (
          <FontAwesome name="refresh" size={16} color="#bbf246" />
        )}
      </Animated.View>

      <AnimatedScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        bounces={true}
      >
      <View className="px-6 pb-6" style={{ paddingTop: insets.top + 24 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8 mt-4">
          <View className="flex-1 pr-4">
            <Text className="text-white text-2xl font-bold" numberOfLines={1}>Welcome back, Shafeen!</Text>
          </View>
          <View className="w-20 h-20 rounded-full" style={{ backgroundColor: '#2a2a2a' }}>
            {/* Profile image placeholder */}
          </View>
        </View>

        {/* Calendar */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-3">{monthName} {year}</Text>
          <View className="flex-row justify-between">
            {calendarDays.map((item, index) => (
              <View key={index} className="items-center">
                <Text style={{ color: '#a0a0a0' }} className="text-sm mb-2">{item.day}</Text>
                <View 
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    item.isToday ? 'bg-white' : ''
                  }`}
                >
                  <Text 
                    className={`text-sm font-medium ${
                      item.isToday ? 'text-black' : 'text-white'
                    }`}
                  >
                    {item.date}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quote of the day */}
        <View 
          className="p-6 rounded-2xl mb-6 relative"
          style={{ backgroundColor: '#ffd93d', minHeight: 100 }}
        >
          <View className="pr-16 flex-1 justify-center">
            <Text className="text-black text-2xl font-bold leading-6">quote of the day: {quote}</Text>
          </View>
          <View className="absolute top-4 right-4 w-20 h-20 rounded-lg overflow-hidden">
            <Image 
              source={require('../../assets/images/motivational.jpg')} 
              className="w-full h-full"
              style={{ resizeMode: 'cover' }}
            />
          </View>
        </View>

        {/* Stats Cards Row */}
        <View className="flex-row gap-4 mb-6">
          {/* Steps Card */}
          <View 
            className="flex-1 p-4 rounded-2xl"
            style={{ backgroundColor: '#c59fc4' }}
          >
            <Text className="text-black text-xl font-bold mb-1">Steps</Text>
            <Text className="text-black text-3xl font-bold">{stepCount}</Text>
            <Text className="text-black text-sm">Steps</Text>
          </View>

          {/* Goal Card */}
          <View 
            className="flex-1 p-4 rounded-2xl"
            style={{ backgroundColor: '#bbf246' }}
          >
            <Text className="text-black text-xl font-bold mb-1">Your Goal</Text>
            <Text className="text-black text-base font-medium">{goalMessage}</Text>
          </View>
        </View>

        {/* Calorie Progress */}
        <View 
          className="p-6 rounded-2xl"
          style={{ 
            backgroundColor: '#2a2a2a',
            marginBottom: insets.bottom || 16
          }}
        >
          <View className="flex-row items-center">
            {/* Left side - Text Info */}
            <View className="flex-1 pr-4">
              <View className="mb-4">
                <View className="flex-row items-center mb-1">
                  <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: '#bbf246' }} />
                  <Text className="text-white text-2xl font-semibold">1000 Kcal</Text>
                </View>
                <Text style={{ color: '#a0a0a0' }} className="text-sm ml-6">Target</Text>
              </View>
              
              <View>
                <View className="flex-row items-center mb-1">
                  <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: '#ff6b35' }} />
                  <Text className="text-white text-2xl font-semibold">{burnedCalories} Kcal</Text>
                </View>
                <Text style={{ color: '#a0a0a0' }} className="text-sm ml-6">Burned</Text>
              </View>
            </View>
            
            {/* Right side - Progress Ring */}
            <View className="relative items-center justify-center">
              <Svg width="160" height="160">
                <Circle cx="80" cy="80" r="62" stroke="#bbf246" strokeWidth="35" fill="transparent" />
                <Circle cx="80" cy="80" r="62" stroke="#ff6b35" strokeWidth="35" fill="transparent" strokeDasharray="156 233" strokeLinecap="round" transform="rotate(-80 80 80)" />
              </Svg>
              <View className="absolute rounded-full items-center justify-center" style={{ backgroundColor: '#2a2a2a', width: 2, height: 2 }}>
              </View>
            </View>
          </View>
        </View>
      </View>
      </AnimatedScrollView>
    </View>
  );
}