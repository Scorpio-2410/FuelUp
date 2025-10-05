import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  apiCreateEvent,
  apiListEvents,
  apiUpdateEvent,
  apiDeleteEvent,
  apiAutoPlanWorkouts,
} from "../../constants/api";

type Category = "work" | "workout" | "meal" | "other";
type Repeat = "none" | "daily" | "weekday" | "weekly";

type LocalEvent = {
  id: string;
  dbId: number;
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

function mondayOfWeek(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0=Sun..6=Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + mondayOffset);
  return m;
}

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

function weekWindowISO(monday: Date) {
  const from = new Date(monday);
  from.setHours(0, 0, 0, 0);
  const to = new Date(monday);
  to.setDate(to.getDate() + 7);
  to.setHours(0, 0, 0, 0);
  return { fromISO: from.toISOString(), toISO: to.toISOString() };
}

const monthYear = (d: Date) =>
  d.toLocaleDateString(undefined, { month: "long", year: "numeric" });

const GREEN = "#4ade80";
const LEMON = "#F9FF6E";
const CARD = "#121212";
const TEXT_MUTED = "#9CA3AF";

/* Nicely formatted long date+time for the input display */
const fmtLong = (d: Date) =>
  d.toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/* iOS-style wheel picker presented as a bottom sheet */
function WheelPickerSheet(props: {
  visible: boolean;
  date: Date;
  onConfirm: (d: Date) => void;
  onCancel: () => void;
}) {
  const { visible, date, onCancel, onConfirm } = props;
  const [temp, setTemp] = useState<Date>(date);

  useEffect(() => setTemp(date), [date, visible]);

  // spinner on iOS, default on Android
  const DISPLAY_MODE: any = Platform.OS === "ios" ? "spinner" : "default";

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}>
        <View
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingBottom: 10,
          }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 12,
              paddingTop: 8,
              paddingBottom: 4,
            }}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={{ color: "#EF4444", fontWeight: "700" }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onConfirm(temp)}>
              <Text style={{ color: "#065F46", fontWeight: "700" }}>Done</Text>
            </TouchableOpacity>
          </View>

          <DateTimePicker
            value={temp}
            mode="datetime"
            display={DISPLAY_MODE}
            onChange={(_: any, d?: Date) => {
              if (d) setTemp(d);
            }}
            style={{ alignSelf: "center" }}
          />
        </View>
      </View>
    </Modal>
  );
}

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

  // wheel picker visibility (CREATE)
  const [showStartWheel, setShowStartWheel] = useState(false);
  const [showEndWheel, setShowEndWheel] = useState(false);

  // full-screen create modal
  const [createOpen, setCreateOpen] = useState(false);

  const [saving, setSaving] = useState(false);

  // EDIT dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCategory, setEditCategory] = useState<Category>("work");
  const [editStartDT, setEditStartDT] = useState<Date>(new Date());
  const [editEndDT, setEditEndDT] = useState<Date>(new Date());
  // wheel pickers for EDIT
  const [showEditStartWheel, setShowEditStartWheel] = useState(false);
  const [showEditEndWheel, setShowEditEndWheel] = useState(false);

  // NEW: auto-plan button state
  const [planning, setPlanning] = useState(false);

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
        const startStr: string | undefined =
          (ev as any).startAt ?? (ev as any).start_at;
        if (!startStr) continue;

        const s = new Date(startStr);
        const endStr: string | undefined | null =
          (ev as any).endAt ?? (ev as any).end_at ?? undefined;
        const e = endStr ? new Date(endStr) : null;

        const key = ymd(s);
        if (!grouped[key]) grouped[key] = [];

        const realDbId =
          typeof (ev as any).db_id !== "undefined"
            ? Number((ev as any).db_id)
            : typeof (ev as any).dbId !== "undefined"
            ? Number((ev as any).dbId)
            : Number(ev.id);

        grouped[key].push({
          id: String(ev.id),
          dbId: realDbId,
          dateKey: key,
          start: hhmm(s),
          end: e ? hhmm(e) : hhmm(new Date(s.getTime() + 30 * 60 * 1000)),
          title: (ev as any).title,
          notes: (ev as any).notes || undefined,
          category: ((ev as any).category as Category) || "other",
          color:
            (ev as any).category === "workout"
              ? "#B3FF6E"
              : (ev as any).category === "meal"
              ? "#FFE08A"
              : (ev as any).category === "work"
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
      await apiCreateEvent({
        category,
        title: title.trim(),
        start_at: startDT.toISOString(),
        end_at: endDT.toISOString(),
        notes: notes.trim() || null,
        // send rule as selected; backend (Event.listForSchedule) expands it
        recurrence_rule: repeat, // "none" | "daily" | "weekday" | "weekly"
        recurrence_until: null,
      });

      clearForm();
      Alert.alert("Added", "Your event has been added to your schedule.");
      loadWeek();
    } catch (e: any) {
      Alert.alert("Failed to create event", e?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- Auto-plan workouts button ---------------- */
  const handleAutoPlan = useCallback(async () => {
    if (planning) return;
    setPlanning(true);
    try {
      const { created_count } = await apiAutoPlanWorkouts(7);
      await loadWeek();
      Alert.alert(
        "Workout suggestions",
        created_count > 0
          ? `Added ${created_count} workout${
              created_count > 1 ? "s" : ""
            } based on your schedule.`
          : "No suitable free slots found in the next week."
      );
    } catch (e: any) {
      Alert.alert("Suggestion failed", e?.message || "Please try again.");
    } finally {
      setPlanning(false);
    }
  }, [planning, loadWeek]);

  /* ---------------- Edit/Delete ---------------- */
  const openEditFor = (evt: LocalEvent) => {
    if (!evt.dbId || Number.isNaN(Number(evt.dbId))) {
      Alert.alert(
        "Can’t edit",
        "This occurrence doesn’t have a real event id."
      );
      return;
    }
    setEditId(Number(evt.dbId));
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
              onPress={goNextWeek}
              style={{ position: "absolute", right: 44 }}>
              <Ionicons name="chevron-forward-circle" size={24} color={GREEN} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={{ position: "absolute", right: 12, padding: 4 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={22} color={GREEN} />
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

          {/* Month label */}
          <View style={{ paddingHorizontal: 16, marginTop: 2 }}>
            <Text
              style={{ color: TEXT_MUTED, textAlign: "center", fontSize: 13 }}>
              {monthYear(new Date(selectedDateKey + "T00:00:00"))}
            </Text>
          </View>

          {/* Suggest/Auto-plan button */}
          <View
            style={{
              paddingHorizontal: 16,
              alignItems: "center",
              marginVertical: 8,
            }}>
            <TouchableOpacity
              disabled={planning}
              onPress={handleAutoPlan}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: GREEN,
                backgroundColor: "#E7F9EE",
                opacity: planning ? 0.6 : 1,
              }}>
              <Text style={{ color: "#065F46", fontWeight: "700" }}>
                {planning ? "Suggesting…" : "Suggest workout times"}
              </Text>
            </TouchableOpacity>
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
            onPress={() => setCreateOpen(true)}
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

          {/* Create Event - full screen modal */}
          <Modal
            visible={createOpen}
            animationType="slide"
            onRequestClose={() => setCreateOpen(false)}>
            <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
              {/* Top bar */}
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingTop: 6,
                  paddingBottom: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                <Text
                  style={{ fontSize: 18, fontWeight: "800", color: "black" }}>
                  Create Event
                </Text>
                <TouchableOpacity
                  onPress={() => setCreateOpen(false)}
                  hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                  style={{ position: "absolute", right: 10 }}>
                  <Ionicons name="close-circle" size={28} color={GREEN} />
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: 24,
                }}>
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
                <View
                  style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
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

                {/* Start */}
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
                  onPress={() => setShowStartWheel(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                  }}>
                  <Text style={{ color: "#065F46", fontWeight: "600" }}>
                    {fmtLong(startDT)}
                  </Text>
                </TouchableOpacity>

                {/* End */}
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
                  onPress={() => setShowEndWheel(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                  }}>
                  <Text style={{ color: "#065F46", fontWeight: "600" }}>
                    {fmtLong(endDT)}
                  </Text>
                </TouchableOpacity>

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
                  onPress={async () => {
                    await handleCreate();
                    setCreateOpen(false);
                  }}
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
                  onPress={() => setCreateOpen(false)}
                  style={{
                    alignItems: "center",
                    marginTop: 12,
                    marginBottom: 8,
                  }}>
                  <Text style={{ color: "#EF4444" }}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Wheel pickers (CREATE) */}
              <WheelPickerSheet
                visible={showStartWheel}
                date={startDT}
                onCancel={() => setShowStartWheel(false)}
                onConfirm={(d) => {
                  setShowStartWheel(false);
                  setStartDT(d);
                  if (d >= endDT) {
                    const e = new Date(d.getTime() + 60 * 60 * 1000);
                    setEndDT(e);
                  }
                  const key = ymd(d);
                  setSelectedDateKey(key);
                  setMonday(mondayOfWeek(key));
                }}
              />
              <WheelPickerSheet
                visible={showEndWheel}
                date={endDT}
                onCancel={() => setShowEndWheel(false)}
                onConfirm={(d) => {
                  setShowEndWheel(false);
                  setEndDT(d);
                }}
              />
            </SafeAreaView>
          </Modal>

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

                {/* Start */}
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
                  onPress={() => setShowEditStartWheel(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                  }}>
                  <Text style={{ color: "#065F46", fontWeight: "600" }}>
                    {fmtLong(editStartDT)}
                  </Text>
                </TouchableOpacity>

                {/* End */}
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
                  onPress={() => setShowEditEndWheel(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                  }}>
                  <Text style={{ color: "#065F46", fontWeight: "600" }}>
                    {fmtLong(editEndDT)}
                  </Text>
                </TouchableOpacity>

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

              {/* Wheel pickers (EDIT) */}
              <WheelPickerSheet
                visible={showEditStartWheel}
                date={editStartDT}
                onCancel={() => setShowEditStartWheel(false)}
                onConfirm={(d) => {
                  setShowEditStartWheel(false);
                  setEditStartDT(d);
                  if (d >= editEndDT) {
                    const e = new Date(d.getTime() + 60 * 60 * 1000);
                    setEditEndDT(e);
                  }
                  const key = ymd(d);
                  setSelectedDateKey(key);
                  setMonday(mondayOfWeek(key));
                }}
              />
              <WheelPickerSheet
                visible={showEditEndWheel}
                date={editEndDT}
                onCancel={() => setShowEditEndWheel(false)}
                onConfirm={(d) => {
                  setShowEditEndWheel(false);
                  setEditEndDT(d);
                }}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
