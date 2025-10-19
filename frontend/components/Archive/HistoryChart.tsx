import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";

type DayPoint = {
  date: string;
  calories?: number;
  durationMinutes?: number;
  steps?: number;
  stepCount?: number;
  count?: number;
};

type Props = {
  days?: number;
  metric?: "calories" | "duration" | "steps";
};

export default function HistoryChart({ days = 30, metric = "calories" as "calories" | "duration" | "steps" }: Props) {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<DayPoint[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch(`/api/fitness/activities/historical?days=${days}`);
        if (!mounted) return;
        if (!resp.ok) {
          setPoints([]);
          setLoading(false);
          return;
        }
        const json = await resp.json();
        const data = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
        setPoints(data);
      } catch (err) {
        console.warn("HistoryChart fetch error", err);
        setPoints([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [days]);

  if (loading) return <ActivityIndicator style={{ margin: 12 }} />;
  const generateEmptyPoints = (n: number): DayPoint[] => {
    const out: DayPoint[] = [];
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      out.push({ date: d.toISOString().slice(0, 10), calories: 0, durationMinutes: 0, steps: 0 });
    }
    return out;
  };

  const dataPoints = (points && points.length > 0) ? points : generateEmptyPoints(days);

  const labels = dataPoints.map(p => (p.date ? p.date.slice(5) : "")); // MM-DD
  const values = dataPoints.map(p => {
    if (metric === "duration") return Number(p.durationMinutes ?? 0);
    if (metric === "calories") return Number(p.calories ?? 0);
    // steps fallback: prefer steps, then stepCount, then calories as last resort
    return Number(p.steps ?? p.stepCount ?? p.calories ?? 0);
  });
  const screenWidth = Math.min(Dimensions.get("window").width - 32, 720);

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <Text style={{ fontWeight: "600", marginBottom: 6 }}>
        {metric === "duration" ? "Duration (min)" : metric === "calories" ? "Calories burned" : "Steps"} — last {days} days
      </Text>

      <View style={{ paddingBottom: 8 }}>
        <LineChart
          data={{
            labels: labels.slice(-5),
            datasets: [{ data: values.slice(-5) }]
          }}
          width={screenWidth - 40}
          height={160}
          yAxisSuffix={metric === "duration" ? "m" : metric === "calories" ? " kcal" : ""}
          withInnerLines={false}
          withOuterLines={false}
          withShadow={false}
          withDots={false}
          chartConfig={{
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(34,150,243,${opacity})`,
            labelColor: (opacity = 0.6) => `rgba(0,0,0,${opacity})`,
            propsForBackgroundLines: { strokeWidth: 0 },
          }}
          bezier
          style={{
            borderRadius: 8,
            marginTop: 8,
            marginHorizontal: 16,
            marginBottom: 0,
          }}
        />
      </View>

    </View>
  );
}