import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import DynamicBackground from '../components/Theme/DynamicTheme';
import { useTheme } from '../contexts/ThemeContext';
import { Stack, useRouter } from 'expo-router';
import { stepsCaloriesBurn, UserProfile } from '../components/StepsAnalysis/StepsCaloriesBurn';

const { width: screenWidth } = Dimensions.get('window');

export default function CaloriesFormula() {
  const { theme } = useTheme();
  const router = useRouter();
  const [exampleResult, setExampleResult] = useState<any>(null);

  // Calculate example with 70kg user and 8000 steps
  useEffect(() => {
    const exampleUser: UserProfile = {
      weightKg: 70,
      heightCm: 175, // Average height
      age: 30,
      gender: 'male',
      fitnessLevel: 'intermediate'
    };

    const result = stepsCaloriesBurn.calculateCalories(
      { steps: 8000 },
      exampleUser
    );

    setExampleResult(result);
  }, []);

  const formatNumber = (num: number, decimals: number = 1) => {
    return num.toFixed(decimals);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DynamicBackground theme={theme} intensity="medium">
        <SafeAreaView className="flex-1">
          {/* Header */}
          <Animated.View 
            entering={FadeIn.duration(300)}
            className="flex-row items-center justify-between px-6 py-4"
          >
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-800/50 items-center justify-center"
            >
              <Text className="text-white text-lg">←</Text>
            </TouchableOpacity>
            
            <Text className="text-white text-lg font-bold">Calories Formula</Text>
            
            <View className="w-10" />
          </Animated.View>

          <ScrollView className="flex-1">
            {/* Formula Explanation */}
            <Animated.View 
              entering={FadeInDown.delay(100).duration(300)}
              className="bg-gray-900/30 rounded-none p-6 mb-6"
            >
              <Text className="text-white text-2xl font-bold mb-4">🔥 How Calories Are Calculated</Text>
              <Text className="text-gray-300 text-lg leading-relaxed mb-4">
                Calories burned from walking are calculated using the MET (Metabolic Equivalent of Task) formula:
              </Text>
              
              <View className="bg-orange-500/20 rounded-xl p-4 mb-4">
                <Text className="text-orange-300 text-xl font-bold text-center">
                  Calories = MET × Weight (kg) × Duration (hours)
                </Text>
              </View>

              <Text className="text-gray-300 text-base leading-relaxed">
                The MET value changes based on your walking speed, fitness level, age, and other factors to give you a personalized calculation.
              </Text>
            </Animated.View>

            {/* Example Setup */}
            <Animated.View 
              entering={FadeInDown.delay(200).duration(300)}
              className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-none p-6 mb-6"
            >
              <Text className="text-white text-xl font-bold mb-4">🎯 Example: Complete Profile</Text>
              <Text className="text-gray-300 text-lg leading-relaxed mb-4">
                Let's walk through the calculation for a complete user profile:
              </Text>
              
              {exampleResult && (
                <View className="bg-white/10 rounded-xl p-4">
                  <View className="flex-row justify-between">
                    <View className="flex-1 mr-4">
                      <Text className="text-white font-bold text-base mb-3">👤 Personal Info</Text>
                      <Text className="text-gray-300 text-base">• Weight: 70kg</Text>
                      <Text className="text-gray-300 text-base">• Height: 175cm</Text>
                      <Text className="text-gray-300 text-base">• Age: 30 years</Text>
                      <Text className="text-gray-300 text-base">• Gender: Male</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-base mb-3">🏃 Activity Info</Text>
                      <Text className="text-gray-300 text-base">• Steps: 8,000</Text>
                      <Text className="text-gray-300 text-base">• Fitness Level: Intermediate</Text>
                      <Text className="text-gray-300 text-base">• Walking Speed: {formatNumber(exampleResult.breakdown.walkingSpeed)} km/h</Text>
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Step-by-Step Breakdown */}
            <Animated.View 
              entering={FadeInDown.delay(300).duration(300)}
              className="bg-gray-900/30 rounded-none p-6 mb-6"
            >
              <Text className="text-white text-xl font-bold mb-4">📊 Step-by-Step Calculation</Text>
              
              {exampleResult && (
                <View className="space-y-4">
                  {/* Step 1: Distance */}
                  <View className="bg-rose-500/20 rounded-xl p-4">
                    <Text className="text-rose-300 font-bold mb-2 text-lg">Step 1: Calculate Distance</Text>
                    <Text className="text-white text-lg mb-2">
                      8,000 steps × {formatNumber(exampleResult.breakdown.stepLength)}m = {formatNumber(exampleResult.breakdown.distance, 2)}km
                    </Text>
                    <Text className="text-gray-300 text-base mb-2">
                      Step length calculation:
                    </Text>
                    <Text className="text-gray-300 text-sm">
                      • Base: 0.75m (default)
                      {'\n'}• Height (175cm): 175 × 0.45 = 0.79m
                      {'\n'}• Gender (male): +5% = 0.83m
                      {'\n'}• Fitness (intermediate): no adjustment
                      {'\n'}• Final step length: {formatNumber(exampleResult.breakdown.stepLength)}m
                    </Text>
                  </View>

                  {/* Step 2: Duration */}
                  <View className="bg-blue-500/20 rounded-xl p-4">
                    <Text className="text-blue-300 font-bold mb-2 text-lg">Step 2: Calculate Duration</Text>
                    <Text className="text-white text-lg mb-2">
                      {formatNumber(exampleResult.breakdown.distance, 2)}km ÷ {formatNumber(exampleResult.breakdown.walkingSpeed)}km/h = {formatNumber(exampleResult.breakdown.duration, 2)}h ({Math.round(exampleResult.breakdown.duration * 60)} minutes)
                    </Text>
                    <Text className="text-gray-300 text-base mb-2">
                      Walking speed calculation:
                    </Text>
                    <Text className="text-gray-300 text-sm">
                      • Base speed: 5.0 km/h
                      {'\n'}• Fitness (intermediate): no adjustment
                      {'\n'}• Age (30): no adjustment (25-65 range)
                      {'\n'}• Final speed: {formatNumber(exampleResult.breakdown.walkingSpeed)} km/h
                    </Text>
                  </View>

                  {/* Step 3: MET Value */}
                  <View className="bg-green-500/20 rounded-xl p-4">
                    <Text className="text-green-300 font-bold mb-2 text-lg">Step 3: Determine MET Value</Text>
                    <Text className="text-white text-lg mb-2">
                      MET = {formatNumber(exampleResult.breakdown.met)} (personalized calculation)
                    </Text>
                    <Text className="text-gray-300 text-base mb-2">
                      MET calculation breakdown:
                    </Text>
                    <Text className="text-gray-300 text-sm">
                      • Base MET: 3.5 (normal walking)
                      {'\n'}• Speed ({formatNumber(exampleResult.breakdown.walkingSpeed)} km/h): 3.5 (normal range)
                      {'\n'}• Distance ({formatNumber(exampleResult.breakdown.distance, 2)}km): no adjustment
                      {'\n'}• Fitness (intermediate): no adjustment
                      {'\n'}• Age (30): -2% (young adult efficiency)
                      {'\n'}• Weight (70kg): no adjustment (50-90kg range)
                      {'\n'}• Final MET: {formatNumber(exampleResult.breakdown.met)}
                    </Text>
                  </View>

                  {/* Step 4: Final Calculation */}
                  <View className="bg-orange-500/20 rounded-xl p-4">
                    <Text className="text-orange-300 font-bold mb-2 text-lg">Step 4: Calculate Calories</Text>
                    <Text className="text-white text-lg">
                      {formatNumber(exampleResult.breakdown.met)} × 70kg × {formatNumber(exampleResult.breakdown.duration, 2)}h = {exampleResult.breakdown.calories} calories
                    </Text>
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Example Summary */}
            <Animated.View 
              entering={FadeInDown.delay(400).duration(300)}
              className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-none p-6 mb-6"
            >
              <Text className="text-white text-xl font-bold mb-4">📋 Final Result</Text>
              <View className="bg-white/10 rounded-xl p-4">
                <Text className="text-white text-lg font-bold mb-3">70kg person with 8,000 steps:</Text>
                {exampleResult && (
                  <View className="space-y-2">
                    <Text className="text-gray-300 text-base">
                      • Distance walked: {formatNumber(exampleResult.breakdown.distance, 2)} km
                    </Text>
                    <Text className="text-gray-300 text-base">
                      • Time taken: {Math.round(exampleResult.breakdown.duration * 60)} minutes
                    </Text>
                    <Text className="text-gray-300 text-base">
                      • Walking speed: {formatNumber(exampleResult.breakdown.walkingSpeed)} km/h
                    </Text>
                    <Text className="text-gray-300 text-base">
                      • MET value: {formatNumber(exampleResult.breakdown.met)}
                    </Text>
                    <Text className="text-orange-300 text-2xl font-bold mt-3">
                      🔥 Total calories burned: {exampleResult.breakdown.calories} kcal
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Comparison Examples */}
            <Animated.View 
              entering={FadeInDown.delay(500).duration(300)}
              className="bg-gray-900/30 rounded-none p-6 mb-6"
            >
              <Text className="text-white text-xl font-bold mb-4">🔄 How Different Profiles Compare</Text>
              <Text className="text-gray-300 text-base mb-4">
                Same 8,000 steps, different personal factors:
              </Text>
              
              <View className="space-y-3">
                {/* Senior Female */}
                <View className="bg-purple-500/20 rounded-xl p-4">
                  <Text className="text-purple-300 font-bold text-base mb-2">👵 Senior Female (65+, 60kg, 160cm)</Text>
                  <Text className="text-gray-300 text-sm">
                    • Step length: 0.72m (shorter, female) → 5.76km
                    {'\n'}• Speed: 4.5 km/h (slower, senior) → 1.28h
                    {'\n'}• MET: 3.7 (higher for senior) → 277 calories
                  </Text>
                </View>
                
                {/* Young Male */}
                <View className="bg-blue-500/20 rounded-xl p-4">
                  <Text className="text-blue-300 font-bold text-base mb-2">👨 Young Male (25, 80kg, 180cm)</Text>
                  <Text className="text-gray-300 text-sm">
                    • Step length: 0.85m (taller, male) → 6.80km
                    {'\n'}• Speed: 5.25 km/h (faster, young) → 1.30h
                    {'\n'}• MET: 3.4 (efficient, young) → 353 calories
                  </Text>
                </View>
                
                {/* Advanced Female */}
                <View className="bg-green-500/20 rounded-xl p-4">
                  <Text className="text-green-300 font-bold text-base mb-2">🏃‍♀️ Advanced Female (35, 55kg, 165cm)</Text>
                  <Text className="text-gray-300 text-sm">
                    • Step length: 0.80m (fitness adjusted) → 6.40km
                    {'\n'}• Speed: 5.5 km/h (faster, advanced) → 1.16h
                    {'\n'}• MET: 3.3 (efficient, advanced) → 210 calories
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Factors Affecting Calculation */}
            <Animated.View 
              entering={FadeInDown.delay(600).duration(300)}
              className="bg-gray-900/30 rounded-2xl p-6 mb-6"
            >
              <Text className="text-white text-xl font-bold mb-4">⚙️ Personal Factors Impact</Text>
              <View className="space-y-4">
                <View className="flex-row items-start">
                  <Text className="text-orange-400 text-xl mr-4">📏</Text>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base">Height & Gender</Text>
                    <Text className="text-gray-300 text-sm">Taller people and males have longer steps → more distance → more calories</Text>
                  </View>
                </View>
                
                <View className="flex-row items-start">
                  <Text className="text-blue-400 text-xl mr-4">🏃</Text>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base">Fitness & Age</Text>
                    <Text className="text-gray-300 text-sm">Fitter and younger people walk faster → higher MET → more calories</Text>
                  </View>
                </View>
                
                <View className="flex-row items-start">
                  <Text className="text-green-400 text-xl mr-4">⚖️</Text>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base">Weight Impact</Text>
                    <Text className="text-gray-300 text-sm">Heavier people work harder (higher MET) but also burn more per hour</Text>
                  </View>
                </View>
                
                <View className="flex-row items-start">
                  <Text className="text-purple-400 text-xl mr-4">🎯</Text>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base">Distance Efficiency</Text>
                    <Text className="text-gray-300 text-sm">Longer walks become more efficient (lower MET per km)</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Note */}
            <Animated.View 
              entering={FadeInDown.delay(700).duration(300)}
              className="bg-yellow-500/10 rounded-2xl p-4 mb-6"
            >
              <Text className="text-yellow-300 text-base leading-relaxed">
                <Text className="font-bold">💡 Note:</Text> This calculation provides an estimate based on general walking patterns. 
                Individual results may vary based on terrain, weather, and personal walking style.
              </Text>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </DynamicBackground>
    </>
  );
}
