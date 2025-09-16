// frontend/components/Fitness/WeeklySchedule.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  apiCreateEvent,
  apiListEvents,
  apiUpdateEvent,
  apiDeleteEvent,
} from "../../constants/api";

type Category = "work" | "workout" | "meal" | "other";
type Repeat = "none" | "daily" | "weekday" | "weekly";

type LocalEvent = {
  id: string; // UI instance id (can be synthetic for recurrences)
  dbId: number; // REAL DB id for mutations
  dateKey: string; // YYYY-MM-DD (local)
  start: string; // HH:mm (local)
  end: string; // HH:mm (local)
  title: string;
  notes?: string;
  category: Category;
  color: string;
};

interface Props {
  onClose?: () => void;
}

/* ---------------- helpers ---------------- */
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Monday of week for a local date string (YYYY-MM-DD) */
function mondayOfWeek(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0=Sun..6=Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + mondayOffset);
  return m;
}

/** 7 days (local) starting from given Monday */
function weekFromMonday(monday: Date) {
  const out: { key: string; label: string; num: number; isToday: boolean }[] =
    [];
  const todayKey = ymd(new Date());
  for (let i = 0; i < 7; i++) {
    const one = new Date(monday);
    one.setDate(monday.getDate() + i);
    out.push({
      key: ymd(one),
      label: one.toLocaleDateString(undefined, { weekday: "short" }),
      num: one.getDate(),
      isToday: ymd(one) === todayKey,
    });
  }
  return out;
}

/** window for API list (local → ISO) */
function weekWindowISO(monday: Date) {
  const from = new Date(monday);
  from.setHours(0, 0, 0, 0);
  const to = new Date(monday);
  to.setDate(to.getDate() + 7);
  to.setHours(0, 0, 0, 0);
  return { fromISO: from.toISOString(), toISO: to.toISOString() };
}

const GREEN = "#4ade80";
const LEMON = "#F9FF6E";
const CARD = "#121212";
const TEXT_MUTED = "#9CA3AF";

export default function WeeklySchedule({ onClose }: Props) {
  const todayKey = ymd(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [monday, setMonday] = useState<Date>(mondayOfWeek(todayKey));
  const week = useMemo(() => weekFromMonday(monday), [monday]);

  // server data grouped by local day
  const [eventsByDay, setEventsByDay] = useState<Record<string, LocalEvent[]>>(
    {}
  );
  const [loading, setLoading] = useState(false);

  // ------- Create/Edit state -------
  const nextHour = (() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d;
  })();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<Category>("work");
  const [repeat, setRepeat] = useState<Repeat>("none");

  const [startDT, setStartDT] = useState<Date>(() => {
    const d = new Date(selectedDateKey + "T00:00:00");
    d.setHours(nextHour.getHours(), 0, 0, 0);
    return d;
  });
  const [endDT, setEndDT] = useState<Date>(() => {
    const e = new Date(selectedDateKey + "T00:00:00");
    e.setHours(nextHour.getHours() + 1, 0, 0, 0);
    return e;
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // EDIT dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null); // DB id!
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCategory, setEditCategory] = useState<Category>("work");
  const [editStartDT, setEditStartDT] = useState<Date>(new Date());
  const [editEndDT, setEditEndDT] = useState<Date>(new Date());

  // keep start/end aligned with selected date if user taps another day
  useEffect(() => {
    const base = new Date(selectedDateKey + "T00:00:00");
    const s = new Date(startDT);
    const e = new Date(endDT);
    s.setFullYear(base.getFullYear(), base.getMonth(), base.getDate());
    e.setFullYear(base.getFullYear(), base.getMonth(), base.getDate());
    setStartDT(s);
    setEndDT(e);
  }, [selectedDateKey]); // eslint-disable-line

  // --------- Fetch week from server every time the week changes ----------
  const loadWeek = useCallback(async () => {
    setLoading(true);
    try {
      const { fromISO, toISO } = weekWindowISO(monday);
      const { events } = await apiListEvents({ from: fromISO, to: toISO });

      const grouped: Record<string, LocalEvent[]> = {};
      for (const ev of events) {
        // ev.id may be synthetic for expanded recurrences; ev.db_id is the real row id
        const s = new Date(ev.startAt || ev.start_at);
        const e =
          ev.endAt || ev.end_at ? new Date(ev.endAt || ev.end_at) : null;

        const key = ymd(s); // local day key
        if (!grouped[key]) grouped[key] = [];

        const realDbId =
          typeof ev.db_id !== "undefined"
            ? Number(ev.db_id)
            : typeof ev.dbId !== "undefined"
            ? Number(ev.dbId)
            : Number(ev.id);

        grouped[key].push({
          id: String(ev.id),
          dbId: realDbId, // ALWAYS the real DB id for mutations
          dateKey: key,
          start: hhmm(s),
          end: e ? hhmm(e) : hhmm(new Date(s.getTime() + 30 * 60 * 1000)),
          title: ev.title,
          notes: ev.notes || undefined,
          category: (ev.category as Category) || "other",
          color:
            ev.category === "workout"
              ? "#B3FF6E"
              : ev.category === "meal"
              ? "#FFE08A"
              : ev.category === "work"
              ? "#93C5FD"
              : "#E5E7EB",
        });
      }
      for (const k of Object.keys(grouped)) {
        grouped[k].sort((a, b) =>
          a.start < b.start ? -1 : a.start > b.start ? 1 : 0
        );
      }
      setEventsByDay(grouped);
    } catch (e: any) {
      console.warn("loadWeek error", e?.message || e);
      Alert.alert("Failed to load schedule", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [monday]);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  const clearForm = () => {
    setTitle("");
    setNotes("");
    setCategory("work");
    setRepeat("none");
    const base = new Date(selectedDateKey + "T00:00:00");
    const s = new Date(base);
    s.setHours(nextHour.getHours(), 0, 0, 0);
    const e = new Date(base);
    e.setHours(nextHour.getHours() + 1, 0, 0, 0);
    setStartDT(s);
    setEndDT(e);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Event title required");
      return;
    }
    if (endDT <= startDT) {
      Alert.alert("End time must be after start time");
      return;
    }

    setSaving(true);
    try {
      // weekday fan-out on client (Mon–Fri current visible week)
      if (repeat === "weekday") {
        const mon = new Date(monday);
        const promises: Promise<any>[] = [];
        for (let i = 0; i < 5; i++) {
          const s = new Date(mon);
          s.setDate(mon.getDate() + i);
          s.setHours(startDT.getHours(), startDT.getMinutes(), 0, 0);
          const e = new Date(
            s.getTime() + (endDT.getTime() - startDT.getTime())
          );
          promises.push(
            apiCreateEvent({
              category,
              title: title.trim(),
              start_at: s.toISOString(),
              end_at: e.toISOString(),
              notes: notes.trim() || null,
              recurrence_rule: "none",
              recurrence_until: null,
            })
          );
        }
        await Promise.all(promises);
      } else {
        await apiCreateEvent({
          category,
          title: title.trim(),
          start_at: startDT.toISOString(),
          end_at: endDT.toISOString(),
          notes: notes.trim() || null,
          recurrence_rule: repeat === "none" ? "none" : repeat, // (do not send "weekday" here)
          recurrence_until: null,
        });
      }

      clearForm();
      setSheetOpen(false);
      Alert.alert("Added", "Your event has been added to your schedule.");
      loadWeek(); // ensure UI == DB
    } catch (e: any) {
      Alert.alert("Failed to create event", e?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- Edit/Delete ---------------- */
  const openEditFor = (evt: LocalEvent) => {
    if (!evt.dbId || Number.isNaN(Number(evt.dbId))) {
      Alert.alert(
        "Can’t edit",
        "This occurrence doesn’t have a real event id."
      );
      return;
    }
    setEditId(Number(evt.dbId)); // REAL DB id
    setEditTitle(evt.title);
    setEditNotes(evt.notes || "");
    setEditCategory(evt.category);

    const s = new Date(`${evt.dateKey}T${evt.start}:00`);
    const e = new Date(`${evt.dateKey}T${evt.end}:00`);
    setEditStartDT(s);
    setEditEndDT(e);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editId) return;
    if (!editTitle.trim()) {
      Alert.alert("Title required");
      return;
    }
    if (editEndDT <= editStartDT) {
      Alert.alert("End time must be after start time");
      return;
    }
    try {
      await apiUpdateEvent(editId, {
        title: editTitle.trim(),
        notes: editNotes.trim() || null,
        category: editCategory,
        start_at: editStartDT.toISOString(),
        end_at: editEndDT.toISOString(),
      });
      setEditOpen(false);
      loadWeek();
    } catch (e: any) {
      Alert.alert("Failed to update", e?.message || "Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!editId) return;
    try {
      await apiDeleteEvent(editId);
      setEditOpen(false);
      loadWeek();
    } catch (e: any) {
      Alert.alert("Failed to delete", e?.message || "Please try again.");
    }
  };

  /* ------------------------------- UI ------------------------------- */
  const tasksForDay = eventsByDay[selectedDateKey] ?? [];

  const goPrevWeek = () => {
    const m = new Date(monday);
    m.setDate(monday.getDate() - 7);
    setMonday(m);
    const idx = week.findIndex((d) => d.key === selectedDateKey);
    const newKey = weekFromMonday(m)[Math.max(0, idx)].key;
    setSelectedDateKey(newKey);
  };
  const goNextWeek = () => {
    const m = new Date(monday);
    m.setDate(monday.getDate() + 7);
    setMonday(m);
    const idx = week.findIndex((d) => d.key === selectedDateKey);
    const newKey = weekFromMonday(m)[Math.max(0, idx)].key;
    setSelectedDateKey(newKey);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flex: 1, backgroundColor: "black" }}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 6,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
            }}>
            <TouchableOpacity
              onPress={goPrevWeek}
              style={{ position: "absolute", left: 12 }}>
              <Ionicons name="chevron-back-circle" size={24} color={GREEN} />
            </TouchableOpacity>

            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "800",
                textAlign: "center",
              }}>
              Weekly Schedule
            </Text>

            <TouchableOpacity
              onPress={onClose}
              style={{ position: "absolute", right: 44, padding: 4 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={22} color={GREEN} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goNextWeek}
              style={{ position: "absolute", right: 12 }}>
              <Ionicons name="chevron-forward-circle" size={24} color={GREEN} />
            </TouchableOpacity>
          </View>

          {/* Week strip */}
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              paddingHorizontal: 16,
              paddingTop: 6,
              paddingBottom: 10,
              justifyContent: "center",
            }}>
            {week.map((d) => {
              const selected = d.key === selectedDateKey;
              const capsuleColor = selected ? GREEN : "#111";
              const textColor = selected ? "black" : "white";
              const todayRing = d.isToday && !selected;
              return (
                <TouchableOpacity
                  key={d.key}
                  onPress={() => setSelectedDateKey(d.key)}
                  style={{
                    backgroundColor: capsuleColor,
                    width: 48,
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: "center",
                    borderWidth: todayRing ? 2 : 0,
                    borderColor: todayRing ? GREEN : "transparent",
                  }}>
                  <Text
                    style={{ color: textColor, fontSize: 12, opacity: 0.8 }}>
                    {d.label}
                  </Text>
                  <Text
                    style={{
                      color: textColor,
                      fontSize: 14,
                      fontWeight: "700",
                      marginTop: 2,
                    }}>
                    {d.num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Events list */}
          {loading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={GREEN} />
          ) : (
            <FlatList
              data={tasksForDay}
              keyExtractor={(it) => it.id}
              ListEmptyComponent={
                <Text
                  style={{
                    color: TEXT_MUTED,
                    textAlign: "center",
                    marginTop: 24,
                  }}>
                  No tasks scheduled for this day
                </Text>
              }
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 120,
                paddingTop: 6,
              }}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => openEditFor(item)}>
                  <View
                    style={{
                      backgroundColor: CARD,
                      borderRadius: 14,
                      marginBottom: 12,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: "#1F2937",
                    }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}>
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "700",
                          fontSize: 16,
                        }}>
                        {item.title}
                      </Text>
                      <View
                        style={{
                          backgroundColor: item.color,
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}>
                        <Text style={{ fontSize: 11, color: "black" }}>
                          {item.category}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>
                      {item.start} – {item.end}
                    </Text>
                    {!!item.notes && (
                      <Text
                        style={{ color: "#D1D5DB", marginTop: 6, fontSize: 13 }}
                        numberOfLines={3}>
                        {item.notes}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          )}

          {/* FAB */}
          <TouchableOpacity
            onPress={() => setSheetOpen(true)}
            style={{
              position: "absolute",
              bottom: 28,
              alignSelf: "center",
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: GREEN,
              alignItems: "center",
              justifyContent: "center",
              elevation: 5,
            }}>
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>

          {/* Create sheet */}
          {sheetOpen && (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "white",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingTop: 10,
                paddingBottom: 24,
                paddingHorizontal: 16,
                maxHeight: "88%",
              }}>
              {/* header */}
              <View
                style={{ alignItems: "center", marginBottom: 6, marginTop: 4 }}>
                <Text
                  style={{ fontSize: 18, fontWeight: "800", color: "black" }}>
                  Create Event
                </Text>
                <TouchableOpacity
                  onPress={() => setSheetOpen(false)}
                  style={{
                    position: "absolute",
                    right: 6,
                    top: -2,
                    padding: 6,
                  }}>
                  <Ionicons name="close-circle" size={20} color={GREEN} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ maxHeight: 520 }}
                keyboardShouldPersistTaps="handled">
                {/* title */}
                <TextInput
                  placeholder="Event name*"
                  value={title}
                  onChangeText={setTitle}
                  placeholderTextColor="#10B981"
                  style={{
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    marginTop: 10,
                    color: "#065F46",
                  }}
                />

                {/* notes */}
                <TextInput
                  placeholder="Type the note here..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#10B981"
                  style={{
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingTop: 12,
                    marginTop: 10,
                    color: "#065F46",
                    minHeight: 90,
                  }}
                />

                {/* category */}
                <Text
                  style={{
                    marginTop: 14,
                    marginBottom: 6,
                    fontWeight: "700",
                    color: "#065F46",
                  }}>
                  Category
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {(["work", "workout", "meal", "other"] as Category[]).map(
                    (c) => {
                      const active = category === c;
                      return (
                        <TouchableOpacity
                          key={c}
                          onPress={() => setCategory(c)}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: active ? GREEN : "#d1d5db",
                            backgroundColor: active ? "#E7F9EE" : "white",
                          }}>
                          <Text
                            style={{
                              color: active ? "#065F46" : "#111827",
                              fontWeight: "600",
                              textTransform: "lowercase",
                            }}>
                            {c}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>

                {/* Start DateTime */}
                <Text
                  style={{
                    marginTop: 14,
                    marginBottom: 6,
                    fontWeight: "700",
                    color: "#065F46",
                  }}>
                  Start
                </Text>
                <TouchableOpacity
                  onPress={() => setShowStartPicker(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                  }}>
                  <Text style={{ color: "#065F46", fontWeight: "600" }}>
                    {startDT.toLocaleString()}
                  </Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <DateTimePicker
                    value={startDT}
                    mode="datetime"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={(_, d) => {
                      setShowStartPicker(false);
                      if (d) {
                        setStartDT(d);
                        if (d >= endDT) {
                          const e = new Date(d);
                          e.setMinutes(e.getMinutes() + 60);
                          setEndDT(e);
                        }
                      }
                    }}
                  />
                )}

                {/* End DateTime */}
                <Text
                  style={{
                    marginTop: 14,
                    marginBottom: 6,
                    fontWeight: "700",
                    color: "#065F46",
                  }}>
                  End
                </Text>
                <TouchableOpacity
                  onPress={() => setShowEndPicker(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                  }}>
                  <Text style={{ color: "#065F46", fontWeight: "600" }}>
                    {endDT.toLocaleString()}
                  </Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker
                    value={endDT}
                    mode="datetime"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={(_, d) => {
                      setShowEndPicker(false);
                      if (d) setEndDT(d);
                    }}
                  />
                )}

                {/* Repeat */}
                <Text
                  style={{
                    marginTop: 14,
                    marginBottom: 6,
                    fontWeight: "700",
                    color: "#065F46",
                  }}>
                  Repeat
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    marginBottom: 8,
                    flexWrap: "wrap",
                  }}>
                  {(["none", "daily", "weekday", "weekly"] as Repeat[]).map(
                    (r) => {
                      const active = repeat === r;
                      return (
                        <TouchableOpacity
                          key={r}
                          onPress={() => setRepeat(r)}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: active ? GREEN : "#d1d5db",
                            backgroundColor: active ? "#E7F9EE" : "white",
                          }}>
                          <Text
                            style={{
                              color: active ? "#065F46" : "#111827",
                              fontWeight: "600",
                              textTransform: "lowercase",
                            }}>
                            {r}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>

                {/* Create */}
                <TouchableOpacity
                  disabled={saving}
                  onPress={handleCreate}
                  style={{
                    backgroundColor: LEMON,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    marginTop: 12,
                    opacity: saving ? 0.6 : 1,
                  }}>
                  {saving ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <Text style={{ fontWeight: "800", color: "black" }}>
                      Create Event
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Cancel */}
                <TouchableOpacity
                  onPress={() => setSheetOpen(false)}
                  style={{
                    alignItems: "center",
                    marginTop: 12,
                    marginBottom: 8,
                  }}>
                  <Text style={{ color: "#EF4444" }}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Edit sheet */}
          {editOpen && (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "white",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingTop: 10,
                paddingBottom: 24,
                paddingHorizontal: 16,
                maxHeight: "88%",
              }}>
              <View
                style={{ alignItems: "center", marginBottom: 6, marginTop: 4 }}>
                <Text
                  style={{ fontSize: 18, fontWeight: "800", color: "black" }}>
                  Edit Event
                </Text>
                <TouchableOpacity
                  onPress={() => setEditOpen(false)}
                  style={{
                    position: "absolute",
                    right: 6,
                    top: -2,
                    padding: 6,
                  }}>
                  <Ionicons name="close-circle" size={20} color={GREEN} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ maxHeight: 520 }}
                keyboardShouldPersistTaps="handled">
                <TextInput
                  placeholder="Event name*"
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholderTextColor="#10B981"
                  style={{
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    marginTop: 10,
                    color: "#065F46",
                  }}
                />

                <TextInput
                  placeholder="Type the note here..."
                  value={editNotes}
                  onChangeText={setEditNotes}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#10B981"
                  style={{
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingTop: 12,
                    marginTop: 10,
                    color: "#065F46",
                    minHeight: 90,
                  }}
                />

                <Text
                  style={{
                    marginTop: 14,
                    marginBottom: 6,
                    fontWeight: "700",
                    color: "#065F46",
                  }}>
                  Category
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {(["work", "workout", "meal", "other"] as Category[]).map(
                    (c) => {
                      const active = editCategory === c;
                      return (
                        <TouchableOpacity
                          key={c}
                          onPress={() => setEditCategory(c)}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: active ? GREEN : "#d1d5db",
                            backgroundColor: active ? "#E7F9EE" : "white",
                          }}>
                          <Text
                            style={{
                              color: active ? "#065F46" : "#111827",
                              fontWeight: "600",
                              textTransform: "lowercase",
                            }}>
                            {c}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>

                <Text
                  style={{
                    marginTop: 14,
                    marginBottom: 6,
                    fontWeight: "700",
                    color: "#065F46",
                  }}>
                  Start
                </Text>
                <TouchableOpacity
                  onPress={() => setShowStartPicker(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                  }}>
                  <Text style={{ color: "#065F46", fontWeight: "600" }}>
                    {editStartDT.toLocaleString()}
                  </Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <DateTimePicker
                    value={editStartDT}
                    mode="datetime"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={(_, d) => {
                      setShowStartPicker(false);
                      if (d) {
                        setEditStartDT(d);
                        if (d >= editEndDT) {
                          const e = new Date(d);
                          e.setMinutes(e.getMinutes() + 60);
                          setEditEndDT(e);
                        }
                      }
                    }}
                  />
                )}

                <Text
                  style={{
                    marginTop: 14,
                    marginBottom: 6,
                    fontWeight: "700",
                    color: "#065F46",
                  }}>
                  End
                </Text>
                <TouchableOpacity
                  onPress={() => setShowEndPicker(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                  }}>
                  <Text style={{ color: "#065F46", fontWeight: "600" }}>
                    {editEndDT.toLocaleString()}
                  </Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker
                    value={editEndDT}
                    mode="datetime"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={(_, d) => {
                      setShowEndPicker(false);
                      if (d) setEditEndDT(d);
                    }}
                  />
                )}

                <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                  <TouchableOpacity
                    onPress={handleUpdate}
                    style={{
                      backgroundColor: LEMON,
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                      flex: 1,
                    }}>
                    <Text style={{ fontWeight: "800", color: "black" }}>
                      Save Changes
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleDelete}
                    style={{
                      backgroundColor: "#FCA5A5",
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                      flex: 1,
                    }}>
                    <Text style={{ fontWeight: "800", color: "black" }}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setEditOpen(false)}
                  style={{ alignItems: "center", marginTop: 12 }}>
                  <Text style={{ color: "#EF4444" }}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
