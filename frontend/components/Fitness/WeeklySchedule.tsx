// frontend/components/Fitness/WeeklySchedule.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import TaskModal from "./taskModal";
import {
  apiListEvents,
  apiCreateEvent,
  apiSuggestTimes,
} from "../../constants/api";

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function fmtHM(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
function isoLocal(dateStr: string, hm: string) {
  // `${YYYY-MM-DD}T${HH:mm}:00` in local time
  return new Date(`${dateStr}T${hm}:00`).toISOString();
}
function startOfWeek(d = new Date()) {
  const day = d.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // make Monday start (0)
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - diff);
  return x;
}
function endOfWeek(d = new Date()) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 7);
  return e;
}

export default function WeeklySchedule() {
  const [selected, setSelected] = useState(fmtDate(new Date()));
  const [modalVisible, setModalVisible] = useState(false);
  const [category, setCategory] = useState<"meal" | "workout" | "other">(
    "other"
  );
  const [newEvent, setNewEvent] = useState({ title: "", subtitle: "" });

  const generateTimes = () => {
    const times: { label: string; value: string }[] = [];
    for (let h = 6; h <= 23; h++) {
      const hourStr = String(h).padStart(2, "0");
      times.push({ label: `${hourStr}:00`, value: `${hourStr}:00` });
    }
    return times;
  };
  const [items, setItems] = useState(generateTimes());
  const [startTime, setStartTime] = useState("08:00");
  const [open, setOpen] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);
  const [endTime, setEndTime] = useState("09:00");

  const [tasksByDate, setTasksByDate] = useState<Record<string, any[]>>({});
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const loadEvents = useCallback(async () => {
    const from = startOfWeek().toISOString();
    const to = endOfWeek().toISOString();
    const { events } = await apiListEvents({ from, to });

    const map: Record<string, any[]> = {};
    for (const e of events) {
      const s = new Date(e.start_at || e.startAt); // controller returns snake_case; model has camelCase internally
      const ee = new Date(e.end_at || e.endAt || s);
      const dkey = fmtDate(s);
      if (!map[dkey]) map[dkey] = [];
      map[dkey].push({
        id: String(e.id),
        time: `${fmtHM(s)}-${fmtHM(ee)}`,
        title: e.title,
        subtitle: e.notes ?? "",
        color:
          e.category === "workout"
            ? "#B3FF6E"
            : e.category === "meal"
            ? "#F9FF6E"
            : "#C7F7FF",
      });
    }
    setTasksByDate(map);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const tasksForDay = tasksByDate[selected] || [];

  const handleCreateEvent = async () => {
    if (!newEvent.title) return;
    const startISO = isoLocal(selected, startTime);
    const endISO = isoLocal(selected, endTime);
    await apiCreateEvent({
      category,
      title: newEvent.title,
      start_at: startISO,
      end_at: endISO,
      notes: newEvent.subtitle || undefined,
    });
    setNewEvent({ title: "", subtitle: "" });
    setStartTime("08:00");
    setEndTime("09:00");
    setCategory("other");
    setModalVisible(false);
    await loadEvents();
  };

  const markedDates: Record<string, any> = {
    ...Object.keys(tasksByDate).reduce((acc, date) => {
      acc[date] = {
        marked: tasksByDate[date].length > 0,
        dots: [{ color: "#F9FF6E" }],
      };
      return acc;
    }, {} as Record<string, any>),
    [selected]: {
      selected: true,
      selectedColor: "#4ade80",
      selectedTextColor: "black",
    },
  };

  const getSuggestions = async () => {
    const { suggestions } = await apiSuggestTimes({ horizonDays: 7 });
    setSuggestions(suggestions);
    if (!suggestions.length) {
      Alert.alert("No suggestions", "We couldn't find free time this week.");
    }
  };

  const acceptSuggestion = async (s: any) => {
    await apiCreateEvent({
      category: s.type === "meal_prep" ? "other" : "workout",
      title: s.title,
      start_at: s.start_at,
      end_at: s.end_at,
      notes: `Suggested: ${s.reason}`,
    });
    await loadEvents();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <View style={{ alignItems: "center", paddingVertical: 34 }}>
          <Text
            style={{
              color: "white",
              fontSize: 28,
              fontWeight: "800",
              textAlign: "center",
            }}>
            Weekly Schedule
          </Text>
        </View>

        <Calendar
          theme={{
            calendarBackground: "black",
            dayTextColor: "white",
            monthTextColor: "#B3FF6E",
            textMonthFontWeight: "bold",
            textMonthFontSize: 20,
            textDayHeaderFontSize: 14,
            textSectionTitleColor: "#B3FF6E",
            arrowColor: "white",
            textDisabledColor: "gray",
            todayTextColor: "#F9FF6E",
            selectedDayBackgroundColor: "#F9FF6E",
            selectedDayTextColor: "black",
          }}
          style={{ height: 390, marginTop: 16 }}
          current={selected}
          onDayPress={(day) => setSelected(day.dateString)}
          markedDates={markedDates}
          markingType={"multi-dot"}
        />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            marginTop: 8,
          }}>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={{
              backgroundColor: "#4ade80",
              borderRadius: 8,
              padding: 12,
            }}>
            <Text style={{ color: "black", fontWeight: "700" }}>Add Event</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={getSuggestions}
            style={{
              backgroundColor: "#F9FF6E",
              borderRadius: 8,
              padding: 12,
            }}>
            <Text style={{ color: "black", fontWeight: "700" }}>
              Suggest Times
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={tasksForDay}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 150,
            paddingTop: 16,
          }}
          ListEmptyComponent={
            <Text style={{ color: "white", textAlign: "center", fontSize: 16 }}>
              No tasks scheduled for this day
            </Text>
          }
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: item.color,
                padding: 20,
                borderRadius: 16,
                marginBottom: 12,
              }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                <Text
                  style={{ color: "black", fontWeight: "600", fontSize: 12 }}>
                  {item.time}
                </Text>
              </View>
              <Text
                style={{
                  color: "black",
                  fontWeight: "500",
                  marginTop: 4,
                  fontSize: 20,
                }}>
                {item.title}
              </Text>
              {item.subtitle ? (
                <Text
                  style={{
                    color: "black",
                    fontWeight: "500",
                    marginTop: 4,
                    fontSize: 16,
                  }}>
                  {item.subtitle}
                </Text>
              ) : null}
            </View>
          )}
        />

        {/* Suggested quick-add cards */}
        {suggestions.length > 0 && (
          <View
            style={{ position: "absolute", bottom: 100, left: 16, right: 16 }}>
            {suggestions.map((s, i) => {
              const st = new Date(s.start_at);
              const et = new Date(s.end_at);
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => acceptSuggestion(s)}
                  style={{
                    backgroundColor: "#222",
                    borderColor: "#4ade80",
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 12,
                    marginTop: 8,
                  }}>
                  <Text style={{ color: "#B3FF6E", fontWeight: "700" }}>
                    {s.type === "meal_prep" ? "Meal Prep" : "Workout"} •{" "}
                    {st.toLocaleString(undefined, {
                      weekday: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    –
                    {et.toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Text style={{ color: "#bbb" }}>{s.reason}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ position: "absolute", bottom: 40, alignSelf: "center" }}>
          <TouchableOpacity
            style={{
              backgroundColor: "#4ade80",
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <TaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreate={handleCreateEvent}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        open={open}
        setOpen={setOpen}
        openEnd={openEnd}
        setOpenEnd={setOpenEnd}
        items={items}
        setItems={setItems}
        category={category}
        setCategory={setCategory}
      />
    </SafeAreaView>
  );
}
