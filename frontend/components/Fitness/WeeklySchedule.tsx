// frontend/components/Fitness/WeeklySchedule.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  apiCreateEvent,
  apiListEvents,
  apiUpdateEvent,
  apiDeleteEvent,
  apiAutoPlanWorkouts,
  apiSchedulePlansWeekly,
  apiPlanAndScheduleAi,
  apiListPlans,
  apiCreateWorkoutSession,
  apiListPlanExercises,
} from "../../constants/api";
import ExerciseDetailModal from "./ExerciseDetailModal";

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
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingBottom: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 12,
              paddingTop: 8,
              paddingBottom: 4,
            }}
          >
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
  const insets = useSafeAreaInsets();
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

  // Workout time picker for AI suggestions
  const [showWorkoutTimePicker, setShowWorkoutTimePicker] = useState(false);
  const [workoutTime, setWorkoutTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(7, 0, 0, 0); // Default to 7:00 AM
    return d;
  });
  const [isEditingExisting, setIsEditingExisting] = useState(false); // Track if editing or creating new
  const [useUserPlans, setUseUserPlans] = useState(false); // Track if user wants to use their own plans

  // Session viewer and exercise detail modals
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionData, setSessionData] = useState<{
    title: string;
    focus?: string;
    dayIndex?: number | null;
    exercises: any[];
    // For per-occurrence edits
    dbId?: number;
    occurrenceStartISO?: string;
    durationMs?: number;
  } | null>(null);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  // Single-occurrence edit time picker
  const [showSingleEditTimePicker, setShowSingleEditTimePicker] =
    useState(false);
  const [singleEditNewTime, setSingleEditNewTime] = useState<Date | null>(null);

  // Workout tracker: completed exercises and rest timer
  const [workoutStarted, setWorkoutStarted] = useState(false); // Track if user started the workout
  const [workoutElapsedSeconds, setWorkoutElapsedSeconds] = useState(0); // Track elapsed workout time
  const workoutTimerRef = useRef<any>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(
    new Set()
  );
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [currentRestDuration, setCurrentRestDuration] = useState(0);
  const restIntervalRef = useRef<any>(null);

  // Clean up timer on unmount or when session closes
  useEffect(() => {
    if (!sessionOpen) {
      setWorkoutStarted(false);
      setWorkoutElapsedSeconds(0);
      setCompletedExercises(new Set());
      setRestTimerActive(false);
      setRestTimeRemaining(0);
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
      if (workoutTimerRef.current) {
        clearInterval(workoutTimerRef.current);
        workoutTimerRef.current = null;
      }
    }
  }, [sessionOpen]);

  // Workout elapsed timer
  useEffect(() => {
    if (workoutStarted) {
      workoutTimerRef.current = setInterval(() => {
        setWorkoutElapsedSeconds((prev) => prev + 1);
      }, 1000);

      return () => {
        if (workoutTimerRef.current) {
          clearInterval(workoutTimerRef.current);
          workoutTimerRef.current = null;
        }
      };
    } else {
      if (workoutTimerRef.current) {
        clearInterval(workoutTimerRef.current);
        workoutTimerRef.current = null;
      }
    }
  }, [workoutStarted]);

  // Rest timer countdown
  useEffect(() => {
    if (restTimerActive && restTimeRemaining > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTimeRemaining((prev) => {
          if (prev <= 1) {
            setRestTimerActive(false);
            if (restIntervalRef.current) {
              clearInterval(restIntervalRef.current);
              restIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (restIntervalRef.current) {
          clearInterval(restIntervalRef.current);
          restIntervalRef.current = null;
        }
      };
    }
  }, [restTimerActive, restTimeRemaining]);

  const startRestTimer = (durationSeconds: number) => {
    setRestTimeRemaining(durationSeconds);
    setCurrentRestDuration(durationSeconds);
    setRestTimerActive(true);
  };

  const skipRest = () => {
    setRestTimerActive(false);
    setRestTimeRemaining(0);
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
  };

  const adjustRestTime = (seconds: number) => {
    setRestTimeRemaining((prev) => Math.max(0, prev + seconds));
    setCurrentRestDuration((prev) => Math.max(0, prev + seconds));
  };

  const toggleExerciseComplete = (index: number, restSeconds?: number) => {
    setCompletedExercises((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
        // Start rest timer if exercise has rest time
        if (restSeconds && restSeconds > 0) {
          startRestTimer(restSeconds);
        }
      }
      return newSet;
    });
  };

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

  // Check if there are any workout events in the current week
  const hasWorkoutEvents = useMemo(() => {
    return Object.values(eventsByDay).some((events) =>
      events.some((evt) => evt.category === "workout")
    );
  }, [eventsByDay]);

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

    // First, ask user if they want AI-generated or their own plans
    Alert.alert(
      "Workout Schedule",
      "How would you like to create your workout schedule?",
      [
        {
          text: "AI-Generated",
          onPress: () => {
            // Show time picker for AI-generated workouts
            setUseUserPlans(false);
            setIsEditingExisting(false);
            setShowWorkoutTimePicker(true);
          },
        },
        {
          text: "Use My Plans",
          onPress: async () => {
            // Load user's plans and let them schedule each one
            try {
              const { plans } = await apiListPlans();

              if (!plans || plans.length === 0) {
                Alert.alert(
                  "No Plans Found",
                  "You don't have any workout plans yet. Create a plan first or choose AI-Generated."
                );
                return;
              }

              // Set flag and show time picker
              setUseUserPlans(true);
              setIsEditingExisting(false);
              setShowWorkoutTimePicker(true);
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to load plans");
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  }, [planning]);

  const handleEditWorkoutEvents = useCallback(async () => {
    if (planning) return;

    // Show time picker for editing existing workouts
    setIsEditingExisting(true);
    setShowWorkoutTimePicker(true);
  }, [planning]);

  const handleConfirmWorkoutTime = useCallback(
    async (selectedTime: Date) => {
      setShowWorkoutTimePicker(false);
      setWorkoutTime(selectedTime);
      setPlanning(true);

      try {
        // Extract hour and minute from the selected time
        const workoutHour = selectedTime.getHours();
        const workoutMinute = selectedTime.getMinutes();

        if (isEditingExisting) {
          // Update existing workout events
          const { fromISO, toISO } = weekWindowISO(monday);
          const { events } = await apiListEvents({ from: fromISO, to: toISO });

          const workoutEvents = events.filter(
            (ev: any) => ev.category === "workout" || ev.category === "Workout"
          );

          let updated = 0;
          for (const evt of workoutEvents) {
            try {
              const startStr = (evt as any).startAt ?? (evt as any).start_at;
              const endStr = (evt as any).endAt ?? (evt as any).end_at;
              if (!startStr) continue;

              const oldStart = new Date(startStr);
              const oldEnd = endStr
                ? new Date(endStr)
                : new Date(oldStart.getTime() + 60 * 60 * 1000);
              const duration = oldEnd.getTime() - oldStart.getTime();

              // Create new start time with selected hour/minute but same date
              const newStart = new Date(oldStart);
              newStart.setHours(workoutHour, workoutMinute, 0, 0);
              const newEnd = new Date(newStart.getTime() + duration);

              const dbId = (evt as any).db_id ?? (evt as any).dbId ?? evt.id;
              await apiUpdateEvent(Number(dbId), {
                start_at: newStart.toISOString(),
                end_at: newEnd.toISOString(),
              });
              updated++;
            } catch (e) {
              console.warn("Failed to update workout event:", e);
            }
          }

          await loadWeek();
          Alert.alert(
            "Workouts Updated",
            `Updated ${updated} workout${
              updated === 1 ? "" : "s"
            } to ${selectedTime.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}`
          );
        } else if (useUserPlans) {
          // User chose to schedule their own plans
          try {
            const r0 = await apiSchedulePlansWeekly({
              workoutHour,
              workoutMinute,
            });
            const created_count = r0?.created_count ?? 0;
            const infoMsg = (r0 as any)?.message;

            await loadWeek();

            if (created_count && created_count > 0) {
              Alert.alert(
                "Plans Scheduled",
                `Added ${created_count} workout${
                  created_count > 1 ? "s" : ""
                } from your plans at ${selectedTime.toLocaleTimeString(
                  undefined,
                  {
                    hour: "numeric",
                    minute: "2-digit",
                  }
                )}`
              );
            } else {
              Alert.alert(
                "No Plans Scheduled",
                infoMsg ||
                  "You may not have any active workout plans to schedule."
              );
            }
          } catch (e: any) {
            console.error("[Suggest] schedulePlansWeekly failed:", e?.message);
            Alert.alert(
              "Scheduling failed",
              e?.message || "Failed to schedule your plans. Please try again."
            );
          }
        } else {
          // AI-generated workouts
          let created_count = 0;
          let infoMsg: string | undefined;

          try {
            console.log("[Suggest] AI plan generation with force_ai=true");
            const r1 = await apiPlanAndScheduleAi({
              force_ai: true,
              workoutHour,
              workoutMinute,
            });
            created_count = r1?.created_count ?? 0;
            infoMsg = (r1 as any)?.message;
            console.log("[Suggest] AI plan result:", {
              created_count,
              message: infoMsg,
            });
          } catch (e: any) {
            console.error("[Suggest] AI plan generation failed:", e?.message);
            Alert.alert(
              "AI Generation Failed",
              e?.message ||
                "Failed to generate AI workout plan. Please try again."
            );
          }

          await loadWeek();
          if (created_count && created_count > 0) {
            Alert.alert(
              "AI Workouts Created",
              `Added ${created_count} AI-generated workout${
                created_count > 1 ? "s" : ""
              } at ${selectedTime.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}`
            );
          } else if (!infoMsg || !infoMsg.includes("Failed")) {
            Alert.alert(
              "No Workouts Created",
              infoMsg ||
                "Unable to generate workouts based on your fitness profile."
            );
          }
        }
      } catch (e: any) {
        Alert.alert(
          isEditingExisting ? "Update failed" : "Suggestion failed",
          e?.message || "Please try again."
        );
      } finally {
        setPlanning(false);
        setUseUserPlans(false); // Reset flag
      }
    },
    [isEditingExisting, useUserPlans, loadWeek, monday]
  );

  const handleDeleteAllWorkouts = useCallback(async () => {
    Alert.alert(
      "Delete All Workouts",
      "Are you sure you want to delete all workout events? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setShowWorkoutTimePicker(false);
            setPlanning(true);
            try {
              const { fromISO, toISO } = weekWindowISO(monday);
              const { events } = await apiListEvents({
                from: fromISO,
                to: toISO,
              });

              const workoutEvents = events.filter(
                (ev: any) =>
                  ev.category === "workout" || ev.category === "Workout"
              );

              let deleted = 0;
              for (const evt of workoutEvents) {
                try {
                  const dbId =
                    (evt as any).db_id ?? (evt as any).dbId ?? evt.id;
                  await apiDeleteEvent(Number(dbId));
                  deleted++;
                } catch (e) {
                  console.warn("Failed to delete workout event:", e);
                }
              }

              await loadWeek();
              Alert.alert(
                "Workouts Deleted",
                `Deleted ${deleted} workout${deleted === 1 ? "" : "s"}`
              );
            } catch (e: any) {
              Alert.alert("Delete failed", e?.message || "Please try again.");
            } finally {
              setPlanning(false);
            }
          },
        },
      ]
    );
  }, [loadWeek, monday]);

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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
              zIndex: 2,
            }}
          >
            <TouchableOpacity
              onPress={goPrevWeek}
              style={{ position: "absolute", left: 12 }}
            >
              <Ionicons name="chevron-back-circle" size={24} color={GREEN} />
            </TouchableOpacity>

            <Text
              style={{
                color: "white",
                fontSize: 22,
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              Weekly Schedule
            </Text>

            <TouchableOpacity
              onPress={goNextWeek}
              style={{ position: "absolute", right: 44 }}
            >
              <Ionicons name="chevron-forward-circle" size={24} color={GREEN} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={{ position: "absolute", right: 12, padding: 4 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
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
            }}
          >
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
                  }}
                >
                  <Text
                    style={{ color: textColor, fontSize: 12, opacity: 0.8 }}
                  >
                    {d.label}
                  </Text>
                  <Text
                    style={{
                      color: textColor,
                      fontSize: 14,
                      fontWeight: "700",
                      marginTop: 2,
                    }}
                  >
                    {d.num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Month label */}
          <View style={{ paddingHorizontal: 16, marginTop: 2 }}>
            <Text
              style={{ color: TEXT_MUTED, textAlign: "center", fontSize: 13 }}
            >
              {monthYear(new Date(selectedDateKey + "T00:00:00"))}
            </Text>
          </View>

          {/* Suggest/Auto-plan button */}
          <View
            style={{
              paddingHorizontal: 16,
              alignItems: "center",
              marginVertical: 8,
              flexDirection: hasWorkoutEvents ? "row" : "column",
              gap: hasWorkoutEvents ? 10 : 0,
            }}
          >
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
                flex: hasWorkoutEvents ? 1 : 0,
              }}
            >
              <Text
                style={{
                  color: "#065F46",
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                {planning ? "Suggesting…" : "Suggest workout times"}
              </Text>
            </TouchableOpacity>

            {hasWorkoutEvents && (
              <TouchableOpacity
                disabled={planning}
                onPress={handleEditWorkoutEvents}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#F59E0B",
                  backgroundColor: "#FEF3C7",
                  opacity: planning ? 0.6 : 1,
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    color: "#92400E",
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  Edit workout events
                </Text>
              </TouchableOpacity>
            )}
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
                  }}
                >
                  No tasks scheduled for this day
                </Text>
              }
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 120,
                paddingTop: 6,
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={async () => {
                    // If this is a workout with embedded exercises in notes JSON, open session viewer
                    try {
                      const data = item?.notes ? JSON.parse(item.notes) : null;
                      if (item.category === "workout" && data) {
                        // compute occurrence start/end for scope-aware edits
                        const occStart = new Date(
                          `${item.dateKey}T${item.start}:00`
                        );
                        const occEnd = new Date(
                          `${item.dateKey}T${item.end}:00`
                        );
                        const durationMs = Math.max(
                          0,
                          occEnd.getTime() - occStart.getTime()
                        );

                        let exercises: any[] = Array.isArray(data.exercises)
                          ? data.exercises
                          : [];

                        // If this event is linked to a plan, refresh exercises live from the plan
                        const planId = data.plan_id || data.planId;
                        if (planId) {
                          try {
                            const res: any = await apiListPlanExercises(planId);
                            const items = Array.isArray(res?.items)
                              ? res.items
                              : [];
                            if (items.length) {
                              exercises = items.map((r: any) => ({
                                // Use externalId from plan-exercise row to fetch details correctly
                                id: r.externalId ?? r.id ?? null,
                                externalId: r.externalId ?? r.id ?? null,
                                // Mark as public ExerciseDB unless explicitly local
                                source: (
                                  r.source || "exercisedb"
                                ).toLowerCase(),
                                name: r.name || "Exercise",
                                // Keep camelCase from backend but session UI reads these optional fields safely
                                gif_url: r.gifUrl || null,
                                body_part: r.bodyPart || null,
                                target: r.target || null,
                                equipment: r.equipment || null,
                                // defaults so session UI is interactive
                                sets: 3,
                                reps: "10",
                                rest_seconds: 60,
                                estimated_seconds: 120,
                              }));
                            }
                          } catch (e) {
                            // If fetching fails, fall back to embedded snapshot
                          }
                        }

                        if (exercises && exercises.length > 0) {
                          setSessionData({
                            title: item.title,
                            focus:
                              (data as any).focus ||
                              (data as any).plan_name ||
                              "Workout",
                            dayIndex: (data as any).day_index || null,
                            exercises,
                            dbId: Number(item.dbId),
                            occurrenceStartISO: occStart.toISOString(),
                            durationMs,
                          });
                          setSessionOpen(true);
                          return;
                        }
                      }
                    } catch {}
                    openEditFor(item);
                  }}
                >
                  <View
                    style={{
                      backgroundColor: CARD,
                      borderRadius: 14,
                      marginBottom: 12,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: "#1F2937",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "700",
                          fontSize: 16,
                        }}
                      >
                        {item.title}
                      </Text>
                      <View
                        style={{
                          backgroundColor: item.color,
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: "black" }}>
                          {item.category}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>
                      {item.start} – {item.end}
                    </Text>
                    {/* Description: if workout + JSON notes, show a friendly summary; else show raw notes */}
                    {(() => {
                      if (item.category === "workout" && item.notes) {
                        try {
                          const data = JSON.parse(item.notes);
                          if (data && Array.isArray(data.exercises)) {
                            const focus = data.focus || "Workout";
                            const count = data.exercises.length;
                            // rest seconds range among exercises
                            const rests = data.exercises
                              .map((e: any) => Number(e?.rest_seconds) || 0)
                              .filter((n: number) => n > 0);
                            let restStr = "";
                            if (rests.length) {
                              const min = Math.min(...rests);
                              const max = Math.max(...rests);
                              restStr =
                                min === max
                                  ? `${min}s rest`
                                  : `${min}–${max}s rest`;
                            }
                            const parts = [
                              focus,
                              `${count} exercise${count === 1 ? "" : "s"}`,
                            ];
                            if (restStr) parts.push(restStr);
                            return (
                              <Text
                                style={{
                                  color: "#D1D5DB",
                                  marginTop: 6,
                                  fontSize: 13,
                                }}
                                numberOfLines={3}
                              >
                                {parts.join(" • ")}
                              </Text>
                            );
                          }
                        } catch {}
                      }
                      if (item.notes) {
                        return (
                          <Text
                            style={{
                              color: "#D1D5DB",
                              marginTop: 6,
                              fontSize: 13,
                            }}
                            numberOfLines={3}
                          >
                            {item.notes}
                          </Text>
                        );
                      }
                      return null;
                    })()}
                  </View>
                </TouchableOpacity>
              )}
            />
          )}

          {/* Workout Session viewer (list of exercises) */}
          {sessionOpen && (
            <Modal
              visible={sessionOpen}
              animationType="slide"
              transparent={false}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#000",
                  paddingTop: insets.top + 14,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#222",
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      // If workout is started, confirm before closing
                      if (workoutStarted) {
                        Alert.alert(
                          "Stop Workout?",
                          "Are you sure you want to stop this workout? Your progress will be lost.",
                          [
                            {
                              text: "No",
                              style: "cancel",
                            },
                            {
                              text: "Yes",
                              style: "destructive",
                              onPress: () => {
                                setSessionOpen(false);
                                setWorkoutStarted(false);
                                setWorkoutElapsedSeconds(0);
                                setCompletedExercises(new Set());
                                setRestTimerActive(false);
                                setRestTimeRemaining(0);
                                if (restIntervalRef.current) {
                                  clearInterval(restIntervalRef.current);
                                  restIntervalRef.current = null;
                                }
                                if (workoutTimerRef.current) {
                                  clearInterval(workoutTimerRef.current);
                                  workoutTimerRef.current = null;
                                }
                              },
                            },
                          ]
                        );
                      } else {
                        setSessionOpen(false);
                      }
                    }}
                    style={{ marginRight: 10, padding: 6 }}
                  >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 18,
                      fontWeight: "800",
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {sessionData?.title || "Workout"}
                  </Text>

                  {/* Workout Timer - shown when workout is active */}
                  {workoutStarted && (
                    <View
                      style={{
                        backgroundColor: "#1F2937",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        marginRight: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: GREEN,
                          fontWeight: "700",
                          fontSize: 16,
                          fontVariant: ["tabular-nums"],
                        }}
                      >
                        {Math.floor(workoutElapsedSeconds / 60)}:
                        {String(workoutElapsedSeconds % 60).padStart(2, "0")}
                      </Text>
                    </View>
                  )}

                  {/* Start Workout Button */}
                  {!workoutStarted && (
                    <TouchableOpacity
                      onPress={() => setWorkoutStarted(true)}
                      style={{
                        backgroundColor: GREEN,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        marginRight: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: "#000",
                          fontWeight: "700",
                          fontSize: 14,
                        }}
                      >
                        Start Workout
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Edit button - hidden when workout is active */}
                  {!!sessionData?.dbId && !workoutStarted && (
                    <TouchableOpacity
                      onPress={() => {
                        // Open quick actions for this occurrence
                        const occISO = sessionData?.occurrenceStartISO;
                        const dbId = sessionData?.dbId;
                        if (!occISO || !dbId) return;
                        Alert.alert(
                          "Edit this workout",
                          "What would you like to do?",
                          [
                            {
                              text: "Change time",
                              onPress: () => setShowSingleEditTimePicker(true),
                            },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: () => {
                                // Ask scope for delete
                                Alert.alert(
                                  "Delete scope",
                                  "Apply to which occurrences?",
                                  [
                                    {
                                      text: "Only this day",
                                      onPress: async () => {
                                        try {
                                          await apiDeleteEvent(dbId, {
                                            apply_to: "single",
                                            occurrence_at: occISO,
                                          });
                                          setSessionOpen(false);
                                          await loadWeek();
                                        } catch (e: any) {
                                          Alert.alert(
                                            "Delete failed",
                                            e?.message || "Please try again."
                                          );
                                        }
                                      },
                                    },
                                    {
                                      text: "All in series",
                                      style: "destructive",
                                      onPress: async () => {
                                        try {
                                          await apiDeleteEvent(dbId);
                                          setSessionOpen(false);
                                          await loadWeek();
                                        } catch (e: any) {
                                          Alert.alert(
                                            "Delete failed",
                                            e?.message || "Please try again."
                                          );
                                        }
                                      },
                                    },
                                    { text: "Cancel", style: "cancel" },
                                  ]
                                );
                              },
                            },
                            { text: "Cancel", style: "cancel" },
                          ]
                        );
                      }}
                      style={{ padding: 6 }}
                    >
                      <Ionicons name="create-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Build an interleaved list: exercise, rest, exercise, ... */}
                {(() => {
                  const exs = sessionData?.exercises || [];
                  const rows: Array<{
                    type: "exercise" | "rest";
                    key: string;
                    data?: any;
                    rest?: number;
                    exerciseIndex?: number;
                  }> = [];
                  for (let i = 0; i < exs.length; i++) {
                    const ex = exs[i];
                    rows.push({
                      type: "exercise",
                      key: `ex-${i}-${ex?.externalId || ex?.id || i}`,
                      data: ex,
                      exerciseIndex: i,
                    });
                    const restSec = Number(ex?.rest_seconds) || 0;
                    if (i < exs.length - 1 && restSec > 0) {
                      rows.push({
                        type: "rest",
                        key: `rest-${i}`,
                        rest: restSec,
                      });
                    }
                  }
                  return (
                    <>
                      {/* Rest Timer Banner */}
                      {restTimerActive && (
                        <View
                          style={{
                            backgroundColor: "#F59E0B",
                            padding: 16,
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "#000",
                              fontSize: 16,
                              fontWeight: "700",
                              marginBottom: 8,
                            }}
                          >
                            Rest Time
                          </Text>
                          <Text
                            style={{
                              color: "#000",
                              fontSize: 48,
                              fontWeight: "800",
                              marginBottom: 12,
                            }}
                          >
                            {Math.floor(restTimeRemaining / 60)}:
                            {String(restTimeRemaining % 60).padStart(2, "0")}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 10,
                              marginBottom: 8,
                            }}
                          >
                            <TouchableOpacity
                              onPress={() => adjustRestTime(-10)}
                              style={{
                                backgroundColor: "#FCA5A5",
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                borderRadius: 8,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#000",
                                  fontWeight: "700",
                                }}
                              >
                                -10s
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => adjustRestTime(10)}
                              style={{
                                backgroundColor: "#D1FAE5",
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                borderRadius: 8,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#000",
                                  fontWeight: "700",
                                }}
                              >
                                +10s
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity
                            onPress={skipRest}
                            style={{
                              backgroundColor: "#000",
                              paddingVertical: 10,
                              paddingHorizontal: 20,
                              borderRadius: 8,
                            }}
                          >
                            <Text
                              style={{
                                color: "#F59E0B",
                                fontWeight: "700",
                              }}
                            >
                              Skip Rest
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      <FlatList
                        data={rows}
                        keyExtractor={(row) => row.key}
                        contentContainerStyle={{
                          padding: 16,
                          paddingBottom: workoutStarted ? 200 : 120,
                        }}
                        renderItem={({ item: row }) => {
                          if (row.type === "rest") {
                            return (
                              <View
                                style={{
                                  backgroundColor: "#0a0a0a",
                                  borderRadius: 10,
                                  paddingVertical: 8,
                                  paddingHorizontal: 12,
                                  marginBottom: 10,
                                  borderWidth: 1,
                                  borderColor: "#1F2937",
                                }}
                              >
                                <Text
                                  style={{
                                    color: TEXT_MUTED,
                                    textAlign: "center",
                                  }}
                                >
                                  Rest {row.rest}s
                                </Text>
                              </View>
                            );
                          }
                          const ex = row.data;
                          const exerciseIndex = row.exerciseIndex ?? 0;
                          const isCompleted =
                            completedExercises.has(exerciseIndex);

                          return (
                            <View
                              style={{
                                backgroundColor: CARD,
                                borderRadius: 12,
                                padding: 12,
                                marginBottom: 10,
                                borderWidth: 1,
                                borderColor: isCompleted ? GREEN : "#1F2937",
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              {/* Checkbox - only show after workout starts */}
                              {workoutStarted && (
                                <TouchableOpacity
                                  onPress={() =>
                                    toggleExerciseComplete(
                                      exerciseIndex,
                                      Number(ex?.rest_seconds) || 0
                                    )
                                  }
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    borderWidth: 2,
                                    borderColor: isCompleted
                                      ? GREEN
                                      : TEXT_MUTED,
                                    backgroundColor: isCompleted
                                      ? GREEN
                                      : "transparent",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 12,
                                  }}
                                >
                                  {isCompleted && (
                                    <Ionicons
                                      name="checkmark"
                                      size={20}
                                      color="#000"
                                    />
                                  )}
                                </TouchableOpacity>
                              )}

                              {/* Exercise Info */}
                              <TouchableOpacity
                                style={{ flex: 1 }}
                                onPress={() => {
                                  setSelectedExercise({
                                    id: ex?.externalId || ex?.id,
                                    name: ex?.name,
                                    source: ex?.source || "local",
                                    externalId: ex?.externalId || ex?.id,
                                  });
                                  // Don't close session modal - just open exercise detail on top
                                  setExerciseModalOpen(true);
                                }}
                              >
                                <Text
                                  style={{
                                    color: isCompleted ? TEXT_MUTED : "#fff",
                                    fontWeight: "700",
                                    marginBottom: 4,
                                    textDecorationLine: isCompleted
                                      ? "line-through"
                                      : "none",
                                  }}
                                >
                                  {ex?.name}
                                </Text>
                                {ex?.sets && ex?.reps ? (
                                  <Text style={{ color: TEXT_MUTED }}>
                                    {ex.sets} sets × {String(ex.reps)}
                                  </Text>
                                ) : null}
                              </TouchableOpacity>
                            </View>
                          );
                        }}
                      />

                      {/* Finish Workout Button */}
                      {workoutStarted && (
                        <View style={{ padding: 16, paddingTop: 0 }}>
                          <TouchableOpacity
                            onPress={async () => {
                              try {
                                // Count completed exercises
                                const exercisesCompleted =
                                  completedExercises.size;
                                const totalExercises =
                                  sessionData?.exercises?.length || 0;

                                // Save workout session to database
                                await apiCreateWorkoutSession({
                                  workout_name: sessionData?.title || "Workout",
                                  event_id: sessionData?.dbId,
                                  duration_seconds: workoutElapsedSeconds,
                                  completed_at: new Date().toISOString(),
                                  exercises_completed: exercisesCompleted,
                                  total_exercises: totalExercises,
                                });

                                Alert.alert(
                                  "Well done! 🎉",
                                  "Congratulations on completing this workout!",
                                  [
                                    {
                                      text: "OK",
                                      onPress: () => {
                                        // Stop the workout timer
                                        setWorkoutStarted(false);
                                        setWorkoutElapsedSeconds(0);
                                        if (workoutTimerRef.current) {
                                          clearInterval(
                                            workoutTimerRef.current
                                          );
                                          workoutTimerRef.current = null;
                                        }
                                        // Close the session modal
                                        setSessionOpen(false);
                                        // Reset other states
                                        setCompletedExercises(new Set());
                                        setRestTimerActive(false);
                                        setRestTimeRemaining(0);
                                        if (restIntervalRef.current) {
                                          clearInterval(
                                            restIntervalRef.current
                                          );
                                          restIntervalRef.current = null;
                                        }
                                      },
                                    },
                                  ]
                                );
                              } catch (error) {
                                console.error(
                                  "Error saving workout session:",
                                  error
                                );
                                Alert.alert(
                                  "Error",
                                  "Failed to save workout session. Please try again."
                                );
                              }
                            }}
                            style={{
                              backgroundColor: GREEN,
                              paddingVertical: 16,
                              borderRadius: 12,
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                color: "#000",
                                fontWeight: "800",
                                fontSize: 16,
                              }}
                            >
                              Finish Workout
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  );
                })()}
              </View>

              {/* Exercise detail modal - INSIDE session modal so it appears on top */}
              <ExerciseDetailModal
                visible={exerciseModalOpen}
                exercise={selectedExercise}
                onClose={() => setExerciseModalOpen(false)}
              />

              {/* Single-occurrence time picker - shows first, then scope prompt */}
              {sessionData?.dbId && (
                <Modal
                  visible={showSingleEditTimePicker}
                  transparent
                  animationType="slide"
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowSingleEditTimePicker(false)}
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "rgba(0,0,0,0.5)",
                      paddingBottom: 280,
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={(e) => e.stopPropagation()}
                      style={{
                        backgroundColor: "white",
                        borderRadius: 16,
                        padding: 24,
                        width: "85%",
                        maxWidth: 400,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "700",
                          color: "#065F46",
                          marginBottom: 8,
                          textAlign: "center",
                        }}
                      >
                        Change Workout Time
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: TEXT_MUTED,
                          marginBottom: 20,
                          textAlign: "center",
                        }}
                      >
                        Select your new workout time
                      </Text>

                      <DateTimePicker
                        value={(() => {
                          try {
                            const d = new Date(
                              sessionData?.occurrenceStartISO || new Date()
                            );
                            return d;
                          } catch {
                            return new Date();
                          }
                        })()}
                        mode="time"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(_: any, d?: Date) => {
                          if (d) setSingleEditNewTime(d);
                        }}
                        style={{ alignSelf: "center" }}
                        textColor="#000000"
                        themeVariant="light"
                      />

                      <View
                        style={{ flexDirection: "row", gap: 10, marginTop: 24 }}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            setShowSingleEditTimePicker(false);
                            setSingleEditNewTime(null);
                          }}
                          style={{
                            backgroundColor: "#FCA5A5",
                            paddingVertical: 12,
                            borderRadius: 12,
                            alignItems: "center",
                            flex: 1,
                          }}
                        >
                          <Text style={{ fontWeight: "800", color: "black" }}>
                            Cancel
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            const selectedTime =
                              singleEditNewTime ||
                              new Date(
                                sessionData?.occurrenceStartISO || new Date()
                              );
                            setShowSingleEditTimePicker(false);

                            const dbId = sessionData?.dbId!;
                            const occISO = sessionData?.occurrenceStartISO!;
                            const duration =
                              sessionData?.durationMs || 60 * 60 * 1000;
                            const base = new Date(occISO);
                            const newStart = new Date(base);
                            newStart.setHours(
                              selectedTime.getHours(),
                              selectedTime.getMinutes(),
                              0,
                              0
                            );
                            const newEnd = new Date(
                              newStart.getTime() + duration
                            );

                            // Show scope prompt after time is selected
                            Alert.alert(
                              "Apply change",
                              "Apply to which occurrences?",
                              [
                                {
                                  text: "Only this day",
                                  onPress: async () => {
                                    try {
                                      await apiUpdateEvent(dbId, {
                                        start_at: newStart.toISOString(),
                                        end_at: newEnd.toISOString(),
                                        apply_to: "single",
                                        occurrence_at: occISO,
                                      });
                                      setSessionOpen(false);
                                      await loadWeek();
                                      setSingleEditNewTime(null);
                                    } catch (e: any) {
                                      Alert.alert(
                                        "Update failed",
                                        e?.message || "Please try again."
                                      );
                                    }
                                  },
                                },
                                {
                                  text: "All in series",
                                  onPress: async () => {
                                    try {
                                      await apiUpdateEvent(dbId, {
                                        start_at: newStart.toISOString(),
                                        end_at: newEnd.toISOString(),
                                        apply_to: "all",
                                      });
                                      setSessionOpen(false);
                                      await loadWeek();
                                      setSingleEditNewTime(null);
                                    } catch (e: any) {
                                      Alert.alert(
                                        "Update failed",
                                        e?.message || "Please try again."
                                      );
                                    }
                                  },
                                },
                                {
                                  text: "Cancel",
                                  style: "cancel",
                                  onPress: () => setSingleEditNewTime(null),
                                },
                              ]
                            );
                          }}
                          style={{
                            backgroundColor: LEMON,
                            paddingVertical: 12,
                            borderRadius: 12,
                            alignItems: "center",
                            flex: 1,
                          }}
                        >
                          <Text style={{ fontWeight: "800", color: "black" }}>
                            Confirm
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Modal>
              )}
            </Modal>
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
            }}
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>

          {/* Create Event - full screen modal */}
          <Modal
            visible={createOpen}
            animationType="slide"
            onRequestClose={() => setCreateOpen(false)}
          >
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
                }}
              >
                <Text
                  style={{ fontSize: 18, fontWeight: "800", color: "black" }}
                >
                  Create Event
                </Text>
                <TouchableOpacity
                  onPress={() => setCreateOpen(false)}
                  hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                  style={{ position: "absolute", right: 10 }}
                >
                  <Ionicons name="close-circle" size={28} color={GREEN} />
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: 24,
                }}
              >
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
                  }}
                >
                  Category
                </Text>
                <View
                  style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}
                >
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
                          }}
                        >
                          <Text
                            style={{
                              color: active ? "#065F46" : "#111827",
                              fontWeight: "600",
                              textTransform: "lowercase",
                            }}
                          >
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
                  }}
                >
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
                  }}
                >
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
                  }}
                >
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
                  }}
                >
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
                  }}
                >
                  Repeat
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    marginBottom: 8,
                    flexWrap: "wrap",
                  }}
                >
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
                          }}
                        >
                          <Text
                            style={{
                              color: active ? "#065F46" : "#111827",
                              fontWeight: "600",
                              textTransform: "lowercase",
                            }}
                          >
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
                  }}
                >
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
                  }}
                >
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
              }}
            >
              <View
                style={{ alignItems: "center", marginBottom: 6, marginTop: 4 }}
              >
                <Text
                  style={{ fontSize: 18, fontWeight: "800", color: "black" }}
                >
                  Edit Event
                </Text>
                <TouchableOpacity
                  onPress={() => setEditOpen(false)}
                  style={{
                    position: "absolute",
                    right: 6,
                    top: -2,
                    padding: 6,
                  }}
                >
                  <Ionicons name="close-circle" size={20} color={GREEN} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ maxHeight: 520 }}
                keyboardShouldPersistTaps="handled"
              >
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
                  }}
                >
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
                          }}
                        >
                          <Text
                            style={{
                              color: active ? "#065F46" : "#111827",
                              fontWeight: "600",
                              textTransform: "lowercase",
                            }}
                          >
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
                  }}
                >
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
                  }}
                >
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
                  }}
                >
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
                  }}
                >
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
                    }}
                  >
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
                    }}
                  >
                    <Text style={{ fontWeight: "800", color: "black" }}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setEditOpen(false)}
                  style={{ alignItems: "center", marginTop: 12 }}
                >
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

      {/* Workout Time Picker for AI Suggestions */}
      <Modal visible={showWorkoutTimePicker} transparent animationType="slide">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowWorkoutTimePicker(false)}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            paddingBottom: 280,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 24,
              width: "85%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#065F46",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              {isEditingExisting
                ? "Edit Workout Times"
                : "What time would you like to workout?"}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: TEXT_MUTED,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              {isEditingExisting
                ? "Change all workout times or delete them"
                : "Select your preferred workout time"}
            </Text>

            <DateTimePicker
              value={workoutTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_: any, d?: Date) => {
                if (d) setWorkoutTime(d);
              }}
              style={{ alignSelf: "center" }}
              textColor="#000000"
              themeVariant="light"
            />

            {isEditingExisting ? (
              // Editing existing workouts: show Update Time and Delete All buttons
              <View style={{ gap: 10, marginTop: 24 }}>
                <TouchableOpacity
                  onPress={() => handleConfirmWorkoutTime(workoutTime)}
                  style={{
                    backgroundColor: LEMON,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontWeight: "800", color: "black" }}>
                    Update All Workout Times
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDeleteAllWorkouts}
                  style={{
                    backgroundColor: "#FCA5A5",
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontWeight: "800", color: "black" }}>
                    Delete All Workouts
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowWorkoutTimePicker(false)}
                  style={{ alignItems: "center", marginTop: 4 }}
                >
                  <Text style={{ color: "#6B7280" }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Creating new workouts: show Cancel and Confirm buttons
              <View style={{ flexDirection: "row", gap: 10, marginTop: 24 }}>
                <TouchableOpacity
                  onPress={() => setShowWorkoutTimePicker(false)}
                  style={{
                    backgroundColor: "#FCA5A5",
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Text style={{ fontWeight: "800", color: "black" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleConfirmWorkoutTime(workoutTime)}
                  style={{
                    backgroundColor: LEMON,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Text style={{ fontWeight: "800", color: "black" }}>
                    Confirm
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
