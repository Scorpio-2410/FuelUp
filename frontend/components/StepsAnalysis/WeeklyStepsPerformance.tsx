import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { apiGetStepsChart, StepStats } from '../../constants/api';
import { ChartData, StepsPerformanceProps } from './StepsPerformanceTypes';

const { width: screenWidth } = Dimensions.get('window');
const chartHeight = 200;

// Single Responsibility: Handle weekly steps performance chart
export const WeeklyStepsPerformance: React.FC<StepsPerformanceProps> = ({ 
  currentSteps, 
  onStatsLoaded 
}) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [stats, setStats] = useState<StepStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch weekly data (last 7 days)
  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 6); // 6 days before + today = 7 days
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];
      const response = await apiGetStepsChart(startDateStr, endDateStr);
      
      if (response.success) {
        const completeData: ChartData[] = [];
        const currentDate = new Date(startDate);
        const todayStr = new Date().toISOString().split('T')[0];
        
        while (currentDate <= today) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const isToday = dateStr === todayStr;
          
          let steps = 0;
          if (isToday) {
            // Use real-time data for today
            steps = currentSteps;
          } else {
            // Use server data for other days
            const existingData = response.dailyData?.find((d: any) => {
              const apiDate = d.date.split('T')[0];
              return apiDate === dateStr;
            });
            steps = existingData ? existingData.stepCount : 0;
          }
          
          completeData.push({
            date: currentDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            }),
            steps,
            maxSteps: 0
          });
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Calculate max steps for proper scaling
        const maxSteps = Math.max(...completeData.map(d => d.steps), 1);
        const formattedData = completeData.map(item => ({
          ...item,
          maxSteps
        }));
        
        setChartData(formattedData);
        setStats(response.overallStats);
        onStatsLoaded?.(response.overallStats);
      } else {
        // If API fails, show 7 days with 0 steps
        const completeData: ChartData[] = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= today) {
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
    } catch (error) {
      console.error('WeeklyStepsPerformance: Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update today's steps in real-time
  useEffect(() => {
    if (chartData.length > 0) {
      const today = new Date();
      const todayFormatted = today.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      
      const todayIndex = chartData.findIndex(day => day.date === todayFormatted);
      
      if (todayIndex !== -1) {
        setChartData(prevData => {
          const newData = [...prevData];
          const currentStepsInChart = newData[todayIndex].steps;
          
          // Only update if steps actually changed
          if (currentStepsInChart !== currentSteps) {
            newData[todayIndex] = {
              ...newData[todayIndex],
              steps: currentSteps
            };
            
            // Recalculate max steps for proper scaling
            const maxSteps = Math.max(...newData.map(d => d.steps), 1);
            return newData.map(item => ({
              ...item,
              maxSteps
            }));
          }
          
          return prevData;
        });
      }
    }
  }, [currentSteps, chartData.length]);

  // Fetch data on mount
  useEffect(() => {
    fetchWeeklyData();
  }, []);

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
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 6);
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  if (loading) {
    return (
      <View className="flex-1 px-6 items-center justify-center">
        <Text className="text-white text-lg">Loading weekly data...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 px-6">
      {/* Average Steps */}
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

      {/* Chart */}
      {chartData.length > 0 && (
        <Animated.View 
          entering={FadeInDown.delay(300).duration(300)}
          className="bg-gray-900/30 rounded-2xl p-6 mb-6"
        >
          {/* Y-axis labels */}
          <View className="absolute left-2 top-6 flex-col justify-between" style={{ height: chartHeight - 40 }}>
            <Text className="text-white text-xs">15k</Text>
            <Text className="text-white text-xs">10k</Text>
            <Text className="text-white text-xs">5k</Text>
            <Text className="text-white text-xs">0</Text>
          </View>

          {/* Chart container */}
          <View className="ml-8" style={{ height: chartHeight }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
    </View>
  );
};

