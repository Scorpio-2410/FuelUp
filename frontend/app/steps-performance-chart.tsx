import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiGetStepsChart, StepStats } from '../constants/api';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import DynamicBackground from '../components/Theme/DynamicTheme';
import { useTheme } from '../contexts/ThemeContext';
import { Stack } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;
const chartHeight = 200;

interface ChartData {
  date: string;
  steps: number;
  maxSteps: number;
}

export default function StepsPerformanceChart() {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [stats, setStats] = useState<StepStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch chart data
  const fetchChartData = async () => {
    try {
      setLoading(true);
      
      if (selectedPeriod === 'week') {
        // Week view - Rolling 7 days (6 days before + current day)
        const today = new Date();
        
        // Always go back 6 days to get 7 days total (including today)
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);
        
        const endDate = new Date(today); // End on current day
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        const response = await apiGetStepsChart(startDateStr, endDateStr);
        
        if (response.success) {
          const completeData = [];
          const currentDate = new Date(startDate);
          
          while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const existingData = response.dailyData ? response.dailyData.find((d: any) => {
              // Handle both date formats: "2025-10-08" and "2025-10-08T13:00:00.000Z"
              const apiDate = d.date.split('T')[0];
              return apiDate === dateStr;
            }) : null;
            
            completeData.push({
              date: currentDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              }),
              steps: existingData ? existingData.stepCount : 0,
              maxSteps: 0
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          const maxSteps = Math.max(...completeData.map(d => d.steps), 1); // Ensure at least 1 for display
          const formattedData = completeData.map(item => ({
            ...item,
            maxSteps
          }));
          
          setChartData(formattedData);
          setStats(response.overallStats);
        } else {
          // If API fails, still show 7 days with 0 steps
          const completeData = [];
          const currentDate = new Date(startDate);
          
          while (currentDate <= endDate) {
            completeData.push({
              date: currentDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              }),
              steps: 0,
              maxSteps: 1
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          setChartData(completeData);
        }
      } else {
        // Month view - last 30 days from current date
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        const response = await apiGetStepsChart(startDateStr, endDateStr);
        
        if (response.success) {
          // Filter to only show days with actual step data
          const dataWithSteps = response.dailyData ? response.dailyData.filter((d: any) => d.stepCount > 0) : [];
          
          if (dataWithSteps.length > 0) {
            // Sort by date to ensure chronological order
            dataWithSteps.sort((a: any, b: any) => {
              const dateA = new Date(a.date.split('T')[0]);
              const dateB = new Date(b.date.split('T')[0]);
              return dateA.getTime() - dateB.getTime();
            });
            
            const completeData = dataWithSteps.map((d: any) => ({
              date: new Date(d.date.split('T')[0]).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              }),
              steps: d.stepCount,
              maxSteps: 0
            }));
            
            const maxSteps = Math.max(...completeData.map(d => d.steps), 1);
            const formattedData = completeData.map(item => ({
              ...item,
              maxSteps
            }));
            
            setChartData(formattedData);
            setStats(response.overallStats);
          } else {
            // No data available
            setChartData([]);
          }
        } else {
          // If API fails, show no data
          setChartData([]);
        }
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [selectedPeriod]);

  // Auto-scroll to the rightmost position (most recent data) when data loads
  useEffect(() => {
    if (chartData.length > 0 && selectedPeriod === 'month') {
      // Small delay to ensure the chart is rendered
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chartData, selectedPeriod]);

  const getBarHeight = (steps: number, maxSteps: number) => {
    if (maxSteps === 0) return 0;
    return (steps / maxSteps) * (chartHeight - 60);
  };

  const getBarColor = (steps: number) => {
    if (steps >= 10000) return '#F97316'; // Orange for 10k+
    if (steps >= 8000) return '#F59E0B'; // Amber for 8k+
    if (steps >= 5000) return '#EAB308'; // Yellow for 5k+
    return '#6B7280'; // Gray for low steps
  };

  const getAverageSteps = () => {
    if (!chartData.length) return 0;
    return Math.round(chartData.reduce((sum, day) => sum + day.steps, 0) / chartData.length);
  };

  const getDateRange = () => {
    if (!chartData.length) return '';
    
    if (selectedPeriod === 'week') {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 6);
      
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      // For month view, show last 30 days range
      const now = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
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
              onPress={() => {/* Handle back navigation */}}
              className="w-10 h-10 rounded-full bg-gray-800/50 items-center justify-center"
            >
              <Text className="text-white text-lg">←</Text>
            </TouchableOpacity>
            
            <Text className="text-white text-lg font-bold">Steps Performance</Text>
            
            <View className="w-10" />
          </Animated.View>

        {/* Period Selector */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(300)}
          className="flex-row mx-6 mb-6"
        >
          <TouchableOpacity
            onPress={() => setSelectedPeriod('week')}
            className={`flex-1 py-3 px-4 rounded-l-xl ${
              selectedPeriod === 'week' 
                ? 'bg-orange-500' 
                : 'bg-gray-800/50'
            }`}
          >
            <Text className={`text-center font-bold ${
              selectedPeriod === 'week' ? 'text-white' : 'text-gray-400'
            }`}>
              Week
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setSelectedPeriod('month')}
            className={`flex-1 py-3 px-4 rounded-r-xl ${
              selectedPeriod === 'month' 
                ? 'bg-orange-500' 
                : 'bg-gray-800/50'
            }`}
          >
            <Text className={`text-center font-bold ${
              selectedPeriod === 'month' ? 'text-white' : 'text-gray-400'
            }`}>
              Month
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <ScrollView className="flex-1 px-6">
          {/* No Data Message for Month */}
          {selectedPeriod === 'month' && chartData.length === 0 && (
            <Animated.View 
              entering={FadeInDown.delay(200).duration(300)}
              className="bg-gray-900/30 rounded-2xl p-8 mb-6 items-center"
            >
              <Text className="text-6xl mb-4">📊</Text>
              <Text className="text-white text-xl font-bold mb-2">No Data Available</Text>
              <Text className="text-gray-400 text-center leading-relaxed">
                You've only been using this feature for 10 days.{'\n'}
                Month view will be available once you have more data.
              </Text>
            </Animated.View>
          )}

          {/* Average Steps - Only show if we have data */}
          {chartData.length > 0 && (
            <Animated.View 
              entering={FadeInDown.delay(200).duration(300)}
              className="mb-6"
            >
              <Text className="text-gray-400 text-sm font-bold mb-2">AVERAGE</Text>
              <Text className="text-white text-4xl font-black mb-1">
                {getAverageSteps().toLocaleString()} steps
              </Text>
              <Text className="text-white text-sm">
                {getDateRange()}
              </Text>
            </Animated.View>
          )}

          {/* Chart - Only show if we have data */}
          {chartData.length > 0 && (
            <Animated.View 
              entering={FadeInDown.delay(300).duration(300)}
              className="bg-gray-900/30 rounded-2xl p-6 mb-6"
            >
              {/* Data Range Indicator for Monthly View */}
              {selectedPeriod === 'month' && (
                <View className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                  <Text className="text-gray-300 text-sm font-bold mb-1">DATA RANGE</Text>
                  <Text className="text-white text-sm">
                    {chartData.length} day{chartData.length !== 1 ? 's' : ''} of step data
                    {chartData.length > 0 && (
                      <Text className="text-gray-400">
                        {' • '}
                        {chartData[0].date.split(' ')[1]} {chartData[0].date.split(' ')[2]} - {chartData[chartData.length - 1].date.split(' ')[1]} {chartData[chartData.length - 1].date.split(' ')[2]}
                      </Text>
                    )}
                  </Text>
                </View>
              )}
              {/* Y-axis labels */}
              <View className="absolute left-2 top-6 flex-col justify-between" style={{ height: chartHeight - 40 }}>
                <Text className="text-white text-xs">15k</Text>
                <Text className="text-white text-xs">10k</Text>
                <Text className="text-white text-xs">5k</Text>
                <Text className="text-white text-xs">0</Text>
              </View>

              {/* Chart container */}
              <View className="ml-8" style={{ height: chartHeight }}>
                <ScrollView 
                  ref={scrollViewRef}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                >
                  <View className="flex-row items-end" style={{ minWidth: chartData.length * 50 }}>
                    {chartData.map((day, index) => {
                      const barHeight = getBarHeight(day.steps, day.maxSteps);
                      const barColor = getBarColor(day.steps);
                      
                      return (
                        <View key={index} className="items-center mx-1" style={{ width: 45 }}>
                          {/* Bar */}
                          <View 
                            className="w-full rounded-t-lg"
                            style={{
                              height: barHeight,
                              backgroundColor: barColor,
                              minHeight: day.steps > 0 ? 4 : 0
                            }}
                          />
                          
                          {/* Steps value - only show if > 0 */}
                          {day.steps > 0 && (
                            <Text className="text-white text-xs font-bold mt-2 text-center">
                              {day.steps > 1000 ? `${Math.round(day.steps/1000)}k` : day.steps}
                            </Text>
                          )}
                          
                          {/* Date - simplified format */}
                          <Text className="text-white text-xs mt-1 text-center">
                            {day.date.split(' ')[2]} {/* Show only day number */}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </Animated.View>
          )}
        </ScrollView>
        </SafeAreaView>
      </DynamicBackground>
    </>
  );
}
