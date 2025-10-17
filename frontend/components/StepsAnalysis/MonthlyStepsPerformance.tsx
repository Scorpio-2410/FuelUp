import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { apiGetStepsChart, StepStats } from '../../constants/api';
import { ChartData, StepsPerformanceProps } from './StepsPerformanceTypes';

const { width: screenWidth } = Dimensions.get('window');
const chartHeight = 200;

interface MonthlyStepsPerformanceProps extends StepsPerformanceProps {
  scrollViewRef?: React.RefObject<ScrollView>;
}

// Single Responsibility: Handle monthly steps performance chart
export const MonthlyStepsPerformance: React.FC<MonthlyStepsPerformanceProps> = ({ 
  currentSteps, 
  scrollViewRef,
  onStatsLoaded 
}) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [stats, setStats] = useState<StepStats | null>(null);
  const [loading, setLoading] = useState(true);
  const internalScrollRef = useRef<ScrollView>(null);
  const activeScrollRef = scrollViewRef || internalScrollRef;

  // Fetch monthly data (last 30 days, filtered to days with steps)
  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const response = await apiGetStepsChart(startDateStr, endDateStr);
      
      if (response.success) {
        // Get all days with step data, but always include today
        const today = new Date().toISOString().split('T')[0];
        const dataWithSteps = response.dailyData ? response.dailyData.filter((d: any) => d.stepCount > 0) : [];
        
        // Always include today even if it has 0 steps initially
        const hasToday = dataWithSteps.some((d: any) => d.date.split('T')[0] === today);
        if (!hasToday) {
          dataWithSteps.push({
            id: 0,
            userId: 0,
            date: today,
            stepCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        
        if (dataWithSteps.length > 0) {
          // Sort by date to ensure chronological order
          dataWithSteps.sort((a: any, b: any) => {
            const dateA = new Date(a.date.split('T')[0]);
            const dateB = new Date(b.date.split('T')[0]);
            return dateA.getTime() - dateB.getTime();
          });
          
          const completeData: ChartData[] = dataWithSteps.map((d: any) => {
            const dateStr = d.date.split('T')[0];
            const isToday = dateStr === today;
            
            return {
              date: new Date(d.date.split('T')[0]).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              }),
              steps: isToday ? currentSteps : d.stepCount,
              maxSteps: 0
            };
          });
          
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
          setChartData([]);
        }
      } else {
        setChartData([]);
      }
    } catch (error) {
      console.error('MonthlyStepsPerformance: Error fetching data:', error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to rightmost position (most recent data)
  useEffect(() => {
    if (chartData.length > 0) {
      setTimeout(() => {
        activeScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chartData.length]);

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
    fetchMonthlyData();
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
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  if (loading) {
    return (
      <View className="flex-1 px-6 items-center justify-center">
        <Text className="text-white text-lg">Loading monthly data...</Text>
      </View>
    );
  }

  if (chartData.length === 0) {
    return (
      <View className="flex-1 px-6">
        <Animated.View 
          entering={FadeInDown.delay(200).duration(300)}
          className="bg-gray-900/30 rounded-2xl p-8 mb-6 items-center"
        >
          <Text className="text-6xl mb-4">📊</Text>
          <Text className="text-white text-xl font-bold mb-2">No Data Available</Text>
          <Text className="text-gray-400 text-center leading-relaxed">
            Start tracking your steps to see your monthly performance chart!
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 px-6">
      {/* Average Steps */}
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

      {/* Chart */}
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
          <ScrollView 
            ref={activeScrollRef}
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
    </View>
  );
};

