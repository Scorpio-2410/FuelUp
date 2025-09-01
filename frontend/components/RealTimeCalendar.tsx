// Real-time calendar that updates with your timezone
// Shows current week with today highlighted in white
// Perfect for day/night themes based on your location

import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

interface CalendarDay {
  day: string;
  date: string;
  isToday: boolean;
}

interface RealTimeCalendarProps {
  className?: string;
}

export default function RealTimeCalendar({ className }: RealTimeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  // Update calendar every minute to catch day changes
  useEffect(() => {
    const updateCalendar = () => {
      const now = new Date();
      setCurrentDate(now);
      
      // Generate this week's days with today highlighted
      const today = new Date(now);
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      const startOfWeek = new Date(today);
      const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1; // Handle Sunday properly
      startOfWeek.setDate(today.getDate() - daysToSubtract);

      const weekDays: CalendarDay[] = [];
      const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);

        const isToday = 
          dayDate.getDate() === today.getDate() &&
          dayDate.getMonth() === today.getMonth() &&
          dayDate.getFullYear() === today.getFullYear();

        weekDays.push({
          day: dayNames[i],
          date: dayDate.getDate().toString(),
          isToday
        });
      }

      setCalendarDays(weekDays);
    };

    updateCalendar(); // Run immediately
    const interval = setInterval(updateCalendar, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Get live month and year from current date
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <View className={className}>
      <Text className="text-white text-lg font-semibold mb-3">
        {monthName} {year}
      </Text>
      <View className="flex-row justify-between">
        {calendarDays.map((item, index) => (
          <View key={index} className="items-center">
            <Text style={{ color: "#a0a0a0" }} className="text-sm mb-2">
              {item.day}
            </Text>
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${
                item.isToday ? "bg-white" : ""
              }`}>
              <Text
                className={`text-sm ${
                  item.isToday 
                    ? "text-black font-semibold" 
                    : "text-white font-medium"
                }`}>
                {item.date}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
