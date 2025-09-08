import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import TaskModal from "./taskModal"; // same folder

// ---- types ----
type Category = "work" | "personal" | "outing" | "gym" | "mealprep";
type Recurrence = {
  freq: "none" | "daily" | "weekly";
  daysOfWeek?: number[];
  startDate?: string;
};
export type Task = {
  id: string;
  date?: string; // YYYY-MM-DD
  time: string; // "HH:MM-HH:MM"
  title: string;
  subtitle?: string;
  category: Category;
  color?: string;
  suggested?: boolean;
  recurrence?: Recurrence;
};
type AgendaRow = { key: string; header?: string; task?: Task };
type SyncEvent = {
  userId: string;
  id: string;
  date?: string; // optional for recurring templates
  time: string;
  title: string;
  subtitle?: string;
  category: Category;
  color?: string;
  suggested?: boolean;
  recurrence?: Recurrence;
};

// ---- backend config ----
const API_BASE = "http://localhost:4000";
const USER_ID = "1"; // replace with real id

export default function WeeklySchedule() {
  const [selectedDate, setSelectedDate] = useState(today());
  const [weekOffset, setWeekOffset] = useState(0);
  const [tasksByDate, setTasksByDate] = useState<Record<string, Task[]>>({});
  const [recurringTasks, setRecurringTasks] = useState<Task[]>([]);
  const [suggestions, setSuggestions] = useState<Record<string, any[]>>({}); // by date

  // modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [items, setItems] = useState(generateTimes());
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [open, setOpen] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    subtitle: "",
    date: selectedDate,
    start: "08:00",
    end: "09:00",
    color: "#B3FF6E",
    category: "personal" as Category,
    recurrence: { freq: "none" as const },
  });

  // load local state
  useEffect(() => {
    (async () => {
      const a = await AsyncStorage.getItem("tasksByDate");
      const b = await AsyncStorage.getItem("recurringTasks");
      if (a) setTasksByDate(JSON.parse(a));
      if (b) setRecurringTasks(JSON.parse(b));
    })();
  }, []);

  // persist local state
  useEffect(() => {
    AsyncStorage.setItem("tasksByDate", JSON.stringify(tasksByDate));
  }, [tasksByDate]);
  useEffect(() => {
    AsyncStorage.setItem("recurringTasks", JSON.stringify(recurringTasks));
  }, [recurringTasks]);

  // week days (Sun..Sat)
  const weekDays = useMemo(() => buildWeek(weekOffset), [weekOffset]);
  const rangeLabel = `${formatMD(weekDays[0])} – ${formatMD(weekDays[6])}`;

  // expand one-off + recurring locally
  const tasksForWeek = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const d of weekDays) map[d] = [...(tasksByDate[d] || [])];
    for (const t of recurringTasks) {
      for (const d of weekDays)
        if (recursOn(t, d)) map[d].push({ ...t, id: `${t.id}-${d}`, date: d });
    }
    for (const d of weekDays)
      map[d].sort((a, b) => a.time.localeCompare(b.time));
    return map;
  }, [weekDays, tasksByDate, recurringTasks]);

  // push events to backend
  useEffect(() => {
    const dated: SyncEvent[] = Object.entries(tasksByDate).flatMap(
      ([date, items]) =>
        items.map((t) => ({ ...t, date, userId: USER_ID } as SyncEvent))
    );
    const recurring: SyncEvent[] = recurringTasks.map(
      (t) => ({ ...t, userId: USER_ID } as SyncEvent)
    );
    const all: SyncEvent[] = [...dated, ...recurring];
    fetch(`${API_BASE}/api/schedule/events/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: USER_ID, events: all }),
    }).catch(() => {});
  }, [tasksByDate, recurringTasks]);

  // current week start (Sunday ISO)
  const weekStartISO = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    const sun = new Date(base);
    sun.setDate(base.getDate() - base.getDay());
    return sun.toISOString().slice(0, 10);
  }, [weekOffset]);

  // fetch suggestions for week
  useEffect(() => {
    fetch(
      `${API_BASE}/api/schedule/suggestions?userId=${USER_ID}&weekStart=${weekStartISO}`
    )
      .then((r) => r.json())
      .then((data) => {
        const byDate: Record<string, any[]> = {};
        for (const s of data.suggestions || []) {
          if (!byDate[s.date]) byDate[s.date] = [];
          byDate[s.date].push(s);
        }
        setSuggestions(byDate);
      })
      .catch(() => {});
  }, [weekStartISO, tasksByDate, recurringTasks]);

  const catColor = (t: Task) =>
    t.suggested
      ? t.category === "mealprep"
        ? "#FFE08A"
        : "#6EB3FF"
      : t.color ||
        {
          work: "#FFD166",
          personal: "#B3FF6E",
          outing: "#F9C74F",
          gym: "#90CAF9",
          mealprep: "#FFE08A",
        }[t.category];

  // merge day tasks + suggestions
  const mergeForDay = (d: string): Task[] => {
    const base = tasksForWeek[d] || [];
    const sug = (suggestions[d] || []).map((s: any) => ({
      id: s.id,
      date: s.date,
      time: s.time,
      title: s.title,
      subtitle: s.subtitle,
      category: s.category as Category,
      suggested: true,
      color: s.category === "mealprep" ? "#FFE08A" : "#6EB3FF",
    })) as Task[];
    return [...base, ...sug].sort((a, b) => a.time.localeCompare(b.time));
  };

  const dayTasks = mergeForDay(selectedDate);
  const [agenda, setAgenda] = useState(false);

  // create event locally
  function handleCreateEvent() {
    if (!newEvent.title) return;
    if (!isStartBeforeEnd(startTime, endTime)) return;
    const slot = `${startTime}-${endTime}`;

    if (newEvent.recurrence?.freq && newEvent.recurrence.freq !== "none") {
      const tpl: Task = {
        id: Date.now().toString(),
        time: slot,
        title: newEvent.title,
        subtitle: newEvent.subtitle,
        category: newEvent.category,
        color: newEvent.color,
        recurrence: { ...newEvent.recurrence, startDate: selectedDate },
      };
      setRecurringTasks((prev) => [...prev, tpl]);
    } else {
      setTasksByDate((prev) => {
        const updated = { ...prev };
        const list = updated[selectedDate] ? [...updated[selectedDate]] : [];
        if (list.some((t) => overlap(t.time, slot))) return prev;
        list.push({
          id: Date.now().toString(),
          date: selectedDate,
          time: slot,
          title: newEvent.title,
          subtitle: newEvent.subtitle,
          category: newEvent.category,
          color: newEvent.color,
        });
        updated[selectedDate] = list.sort((a, b) =>
          a.time.localeCompare(b.time)
        );
        return updated;
      });
    }

    setNewEvent({
      title: "",
      subtitle: "",
      date: selectedDate,
      start: "08:00",
      end: "09:00",
      color: "#B3FF6E",
      category: "personal",
      recurrence: { freq: "none" },
    });
    setStartTime("08:00");
    setEndTime("09:00");
    setModalVisible(false);
  }

  function handleDeleteTask(task: Task) {
    if (task.suggested) return; // suggestions not stored locally
    if (task.recurrence && !task.date) {
      setRecurringTasks((prev) => prev.filter((t) => t.id !== task.id));
      return;
    }
    setTasksByDate((prev) => {
      const updated = { ...prev };
      updated[selectedDate] = (updated[selectedDate] || []).filter(
        (t) => t.id !== task.id
      );
      if (!updated[selectedDate]?.length) delete updated[selectedDate];
      return updated;
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <View style={{ flex: 1, backgroundColor: "black" }}>
        {/* header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 6,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <TouchableOpacity onPress={() => setWeekOffset((w) => w - 1)}>
            <Ionicons name="chevron-back" size={24} color="#4ade80" />
          </TouchableOpacity>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>
            {rangeLabel}
          </Text>
          <TouchableOpacity onPress={() => setWeekOffset((w) => w + 1)}>
            <Ionicons name="chevron-forward" size={24} color="#4ade80" />
          </TouchableOpacity>
        </View>

        {/* week strip */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            marginTop: 10,
          }}>
          {weekDays.map((d) => {
            const sel = d === selectedDate;
            const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
              new Date(d).getDay()
            ];
            const dayNum = new Date(d).getDate();
            const hasItems = mergeForDay(d).length > 0;
            return (
              <TouchableOpacity
                key={d}
                onPress={() => setSelectedDate(d)}
                style={{ alignItems: "center", width: `${100 / 7}%` }}>
                <Text style={{ color: "#B3FF6E", fontSize: 12 }}>
                  {dayName}
                </Text>
                <View
                  style={{
                    marginTop: 6,
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: sel ? "#4ade80" : "#222",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  <Text
                    style={{
                      color: sel ? "black" : "white",
                      fontWeight: "700",
                    }}>
                    {dayNum}
                  </Text>
                </View>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: hasItems ? "#F9FF6E" : "transparent",
                    marginTop: 6,
                  }}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* toggle */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 12,
          }}>
          <TouchableOpacity
            onPress={() => setAgenda((a) => !a)}
            style={{
              backgroundColor: "#333",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
            }}>
            <Text style={{ color: "white" }}>
              {agenda ? "Week View" : "Agenda View"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* agenda list */}
        {agenda ? (
          <FlatList<AgendaRow>
            data={flattenWeek(weekDays, mergeForDay)}
            keyExtractor={(it) => it.key}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            renderItem={({ item }) => (
              <View style={{ marginBottom: 12 }}>
                {item.header && (
                  <Text
                    style={{
                      color: "#B3FF6E",
                      marginBottom: 6,
                      fontWeight: "700",
                    }}>
                    {item.header}
                  </Text>
                )}
                {item.task && (
                  <View
                    style={{
                      backgroundColor: catColor(item.task),
                      padding: 16,
                      borderRadius: 14,
                    }}>
                    <Text
                      style={{
                        color: "black",
                        fontSize: 12,
                        fontWeight: "700",
                      }}>
                      {item.task.time}
                    </Text>
                    <Text
                      style={{
                        color: "black",
                        fontSize: 18,
                        fontWeight: "800",
                        marginTop: 2,
                      }}>
                      {item.task.title}
                    </Text>
                    {item.task.subtitle ? (
                      <Text style={{ color: "black", marginTop: 2 }}>
                        {item.task.subtitle}
                      </Text>
                    ) : null}
                    <Text
                      style={{ color: "black", marginTop: 6, fontSize: 12 }}>
                      Category: {item.task.category}
                    </Text>
                    {!item.task.suggested && (
                      <TouchableOpacity
                        onPress={() => handleDeleteTask(item.task!)}
                        style={{ marginTop: 6 }}>
                        <Text style={{ color: "black", fontWeight: "700" }}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}
          />
        ) : (
          // selected-day list
          <FlatList
            data={dayTasks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 120,
              paddingTop: 16,
            }}
            ListEmptyComponent={
              <Text
                style={{ color: "white", textAlign: "center", fontSize: 16 }}>
                No tasks for this day
              </Text>
            }
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: catColor(item),
                  padding: 20,
                  borderRadius: 16,
                  marginBottom: 12,
                  opacity: item.suggested ? 0.92 : 1,
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
                  {!item.suggested && (
                    <TouchableOpacity
                      onPress={() => handleDeleteTask(item)}
                      style={{ marginLeft: 8 }}>
                      <Ionicons name="trash-outline" size={20} color="black" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text
                  style={{
                    color: "black",
                    fontWeight: "700",
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
                      fontSize: 14,
                    }}>
                    {item.subtitle}
                  </Text>
                ) : null}
                <Text
                  style={{
                    color: "black",
                    fontWeight: "500",
                    marginTop: 6,
                    fontSize: 12,
                  }}>
                  Category: {item.category}
                </Text>
                {item.suggested && (
                  <Text style={{ color: "black", marginTop: 4, fontSize: 12 }}>
                    Backend suggestion
                  </Text>
                )}
              </View>
            )}
          />
        )}

        {/* add button */}
        <View style={{ position: "absolute", bottom: 70, alignSelf: "center" }}>
          <TouchableOpacity
            style={{
              backgroundColor: "#4ade80",
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => {
              setNewEvent((p) => ({ ...p, date: selectedDate }));
              setModalVisible(true);
            }}>
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
      />
    </SafeAreaView>
  );
}

/* ---- helpers ---- */
function today() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function buildWeek(offset: number) {
  const base = new Date();
  base.setDate(base.getDate() + offset * 7);
  const first = new Date(base);
  first.setDate(first.getDate() - first.getDay());
  const arr: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(first);
    d.setDate(first.getDate() + i);
    arr.push(d.toISOString().slice(0, 10));
  }
  return arr;
}
function generateTimes() {
  const out: { label: string; value: string }[] = [];
  for (let h = 6; h <= 22; h++) {
    const s = `${String(h).padStart(2, "0")}:00`;
    out.push({ label: s, value: s });
  }
  return out;
}
function toMinutes(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}
function overlap(a: string, b: string) {
  const [as, ae] = a.split("-").map(toMinutes);
  const [bs, be] = b.split("-").map(toMinutes);
  return Math.max(as, bs) < Math.min(ae, be);
}
function isStartBeforeEnd(s: string, e: string) {
  return toMinutes(s) < toMinutes(e);
}
function recursOn(t: Task, dateStr: string) {
  if (!t.recurrence || t.recurrence.freq === "none") return false;
  const d = new Date(dateStr);
  if (t.recurrence.freq === "daily") return true;
  if (t.recurrence.freq === "weekly") {
    const dow = d.getDay();
    return (t.recurrence.daysOfWeek || []).includes(dow);
  }
  return false;
}
function formatMD(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function flattenWeek(days: string[], get: (d: string) => Task[]): AgendaRow[] {
  return days.flatMap((d) => [
    {
      key: `h-${d}`,
      header: `${
        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(d).getDay()]
      } ${formatMD(d)}`,
    },
    ...get(d).map((t) => ({ key: `${d}-${t.id}`, task: t })),
  ]);
}
