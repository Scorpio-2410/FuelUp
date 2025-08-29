// app/(tabs)/homepage.tsx
import React from "react";
import { View, Text, Pressable, ScrollView, Dimensions, Image } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomePageScreen() {
  const currentDate = new Date();
  const monthName = "August";
  const year = "2025";
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  
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

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: '#1a1a1a' }}>
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
            <Text className="text-black text-2xl font-bold leading-6">quote of the day: give up bro</Text>
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
            <Text className="text-black text-3xl font-bold">954</Text>
            <Text className="text-black text-sm">Steps</Text>
          </View>

          {/* Goal Card */}
          <View 
            className="flex-1 p-4 rounded-2xl"
            style={{ backgroundColor: '#bbf246' }}
          >
            <Text className="text-black text-xl font-bold mb-1">Your Goal</Text>
            <Text className="text-black text-base font-medium">you r almost there! keep it up</Text>
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
                  <Text className="text-white text-2xl font-semibold">400 Kcal</Text>
                </View>
                <Text style={{ color: '#a0a0a0' }} className="text-sm ml-6">Burned</Text>
              </View>
            </View>
            
            {/* Right side - Progress Ring */}
            <View className="relative items-center justify-center">
              <View 
                className="w-28 h-28 rounded-full"
                style={{ 
                  borderWidth: 8,
                  borderColor: '#404040',
                  backgroundColor: 'transparent'
                }}
              />
              {/* Progress overlay */}
              <View 
                className="absolute w-40 h-40 pl-10 pr-10 rounded-full"
                style={{ 
                  borderWidth: 30,
                  borderColor: 'transparent',
                  borderTopColor: '#ff6b35',
                  borderRightColor: '#ff6b35',
                  borderBottomColor: '#bbf246',
                  borderLeftColor: '#bbf246',
                  transform: [{ rotate: '-90deg' }]
                }}
              />
              {/* Center circle for clean look */}
              <View 
                className="absolute w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: '#2a2a2a' }}
              >
                <Text className="text-white text-xs font-medium">40%</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}


