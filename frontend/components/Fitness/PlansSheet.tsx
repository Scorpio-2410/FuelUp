import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  apiListPlans,
  apiCreatePlan,
  apiDeletePlan,
  apiListPlanExercises,
  apiRemoveExerciseFromPlan,
  apiUpdatePlan,
  apiGetFitnessProfile,
  apiSuggestWorkout,
  apiAddExerciseToPlan,
} from "../../constants/api";
import ExerciseDetailModal from "./ExerciseDetailModal";

const W = Dimensions.get("window").width;

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Plan = {
  id: number;
  name: string;
  status: string;
  notes?: string | null;
};

export default function PlansSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [exByPlan, setExByPlan] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // edit modal
  const [editing, setEditing] = useState<Plan | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // exercise detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any | null>(null);

  const hasRoom = useMemo(() => (plans?.length || 0) < 3, [plans]);
  const MAX_ACTIVE_PLANS = 10;

  useEffect(() => {
    if (!visible) return;
    load();
  }, [visible]);

  async function load() {
    setLoading(true);
    try {
      const { plans: p } = await apiListPlans();
      setPlans(p || []);
      // fetch exercises for each plan
      const map: Record<string, any[]> = {};
      for (const pl of p || []) {
        const resp = await apiListPlanExercises(pl.id);
        const list = (resp as any)?.items ?? (resp as any)?.exercises ?? [];
        map[pl.id] = Array.isArray(list) ? list : [];
      }
      setExByPlan(map);
    } finally {
      setLoading(false);
    }
  }

  async function createPlan() {
    if (!hasRoom || busy) return;
    setBusy(true);
    try {
      const { plan } = await apiCreatePlan({
        name: `Plan ${plans.length + 1}`,
      });
      await load();
      setEditing(plan);
      setEditName(plan.name || "");
      setEditNotes(plan.notes || "");
    } finally {
      setBusy(false);
    }
  }

  async function deletePlan(id: number) {
    if (busy) return;
    setBusy(true);
    try {
      await apiDeletePlan(id);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(true);
    try {
      await apiUpdatePlan(editing.id, { name: editName, notes: editNotes });
      setEditing(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  function openEdit(pl: Plan) {
    setEditing(pl);
    setEditName(pl.name || "");
    setEditNotes(pl.notes || "");
  }

  async function removeExercise(planId: number, rowId: number) {
    if (busy) return;
    setBusy(true);
    try {
      await apiRemoveExerciseFromPlan(planId, rowId);
      setExByPlan((prev) => {
        const list = (prev[planId] || []).filter((x: any) => x.id !== rowId);
        return { ...prev, [planId]: list };
      });
    } finally {
      setBusy(false);
    }
  }

  function openExerciseDetail(exRow: any) {
    // keep the full plan exercise row (includes source, externalId, gifUrl, etc.)
    setDetailItem(exRow);
    setDetailOpen(true);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View
        style={{
          flex: 1,
          backgroundColor: "#0a0a0a",
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: Math.max(insets.bottom, 10),
        }}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#1f2937",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text
            style={{ color: "#fff", fontWeight: "800", fontSize: 18, flex: 1 }}
          >
            My Plans
          </Text>

          <TouchableOpacity
            onPress={createPlan}
            disabled={!hasRoom || busy}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 10,
              backgroundColor: hasRoom ? "#16a34a" : "#334155",
              marginRight: 6,
            }}
          >
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              if (busy) return;
              setBusy(true);
              try {
                // call suggest workout
                const { profile } = await apiGetFitnessProfile();
                // backend returns camelCase fields (toJSON), use those keys
                const payload: any = {
                  goal: profile?.goal || "general",
                  activityLevel: profile?.activityLevel || "moderate",
                  daysPerWeek: profile?.daysPerWeek || 3,
                  height: profile?.heightCm || undefined,
                  weight: profile?.weightKg || undefined,
                  exercises_per_day: 5,
                };

                const aiResp = await apiSuggestWorkout(payload);
                const workout = aiResp?.workout || aiResp?.workout_text || null;
                if (!workout || !workout.days) {
                  console.warn("AI returned no days", aiResp);
                  Alert.alert(
                    "No plans generated",
                    "The AI did not return any workout days."
                  );
                } else {
                  // respect plan limit (3 active/draft max)
                  const existingCount = plans?.length || 0;
                  const remaining = Math.max(
                    0,
                    MAX_ACTIVE_PLANS - existingCount
                  );
                  if (remaining <= 0) {
                    Alert.alert(
                      "Plan limit reached",
                      `You already have the maximum number of active plans (${MAX_ACTIVE_PLANS}). Please archive or delete a plan first.`
                    );
                  } else {
                    const daysToCreate = workout.days.slice(0, remaining);
                    let createdAny = false;
                    for (const day of daysToCreate) {
                      const name = `${day.day} - ${day.focus}`;
                      try {
                        const created = await apiCreatePlan({ name });
                        const plan = created?.plan;
                        if (!plan) continue;
                        createdAny = true;
                        // add exercises (catch per-exercise errors so one failure doesn't abort)
                        for (const ex of day.exercises || []) {
                          try {
                            // AI-generated plans reference local DB exercise ids (ex.exercise_id),
                            // so mark the source as 'local' when adding so the detail modal
                            // and lookups use the local DB route and media.
                            await apiAddExerciseToPlan(
                              plan.id,
                              ex.exercise_id || ex.external_id || ex.id,
                              ex.name || ex.exercise_name || "Exercise",
                              { source: "local" }
                            );
                          } catch (e) {
                            console.warn("failed to add exercise", e);
                          }
                        }
                      } catch (err: any) {
                        console.warn("failed to create plan", err);
                        // If it's a known API limit error, show friendly alert
                        if (err?.status === 400 && err?.payload?.error) {
                          Alert.alert(
                            "Could not create plan",
                            err.payload.error || "Unknown error"
                          );
                        }
                      }
                    }
                    if (createdAny) await load();
                    if (workout.days.length > remaining) {
                      Alert.alert(
                        "Partial import",
                        `Only ${remaining} plans were created because of the 3-plan limit.`
                      );
                    }
                  }
                }
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 10,
              backgroundColor: "#2563eb",
              marginRight: 6,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Suggest Workouts
            </Text>
          </TouchableOpacity>

          {plans.length > 0 && (
            <TouchableOpacity
              onPress={() => deletePlan(plans[0].id)}
              disabled={busy}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
                backgroundColor: "#1f2937",
              }}
            >
              <Ionicons name="trash" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <ActivityIndicator />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{
              padding: 14,
              paddingBottom: Math.max(insets.bottom + 20, 40),
            }}
          >
            {plans.map((pl) => {
              const list = exByPlan[pl.id] || [];
              return (
                <View
                  key={pl.id}
                  style={{
                    marginBottom: 18,
                    backgroundColor: "#0b1220",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#111827",
                  }}
                >
                  {/* plan row header */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      gap: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: 16,
                        flex: 1,
                      }}
                    >
                      {pl.name}
                    </Text>

                    <TouchableOpacity
                      onPress={() => openEdit(pl)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: "#111827",
                      }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color="#93c5fd"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => deletePlan(pl.id)}
                      disabled={busy}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: "#111827",
                        marginLeft: 6,
                      }}
                    >
                      <Ionicons name="trash" size={18} color="#fca5a5" />
                    </TouchableOpacity>
                  </View>

                  {!!pl.notes && (
                    <Text
                      style={{
                        color: "#94a3b8",
                        paddingHorizontal: 12,
                        paddingTop: 0,
                        paddingBottom: 8,
                      }}
                    >
                      {pl.notes}
                    </Text>
                  )}

                  {/* exercises */}
                  <View style={{ gap: 10, padding: 12 }}>
                    {list.map((row: any) => (
                      <View
                        key={row.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "#0f172a",
                          borderRadius: 12,
                          padding: 12,
                        }}
                      >
                        {/* No image here to avoid 422 issues */}
                        <TouchableOpacity
                          style={{ flex: 1 }}
                          onPress={() => openExerciseDetail(row)}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "600",
                              flexShrink: 1,
                            }}
                          >
                            {row.name}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => removeExercise(pl.id, row.id)}
                          disabled={busy}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 10,
                            backgroundColor: "#991b1b",
                            marginLeft: 10,
                          }}
                        >
                          <Ionicons name="remove" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}

                    {list.length === 0 && (
                      <Text style={{ color: "#9ca3af" }}>
                        No exercises yet. Add from the Fitness → Exercises page.
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Edit plan modal (name + notes) */}
      <Modal
        visible={!!editing}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: insets.top + 18,
            paddingBottom: insets.bottom + 18,
            paddingHorizontal: 18,
          }}
        >
          <View
            style={{
              width: Math.min(W - 32, 520),
              backgroundColor: "#0b1220",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#1f2937",
              padding: 16,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "800",
                fontSize: 16,
                marginBottom: 10,
              }}
            >
              Edit Plan
            </Text>

            <Text style={{ color: "#94a3b8", marginBottom: 6 }}>Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Plan name"
              placeholderTextColor="#6b7280"
              style={{
                color: "#fff",
                backgroundColor: "#0f172a",
                borderWidth: 1,
                borderColor: "#1f2937",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 12,
              }}
            />

            <Text style={{ color: "#94a3b8", marginBottom: 6 }}>Notes</Text>
            <TextInput
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Add a note about this plan"
              placeholderTextColor="#6b7280"
              multiline
              style={{
                color: "#fff",
                backgroundColor: "#0f172a",
                borderWidth: 1,
                borderColor: "#1f2937",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                minHeight: 90,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 14,
              }}
            >
              <TouchableOpacity
                onPress={() => setEditing(null)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: "#111827",
                }}
              >
                <Text style={{ color: "#cbd5e1" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveEdit}
                disabled={busy}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: "#16a34a",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Exercise detail modal (shows image there) */}
      <ExerciseDetailModal
        visible={detailOpen}
        // pass the full plan exercise row so the modal can use
        // externalId / external_id and source to resolve images/instructions
        exercise={detailItem ? (detailItem as any) : null}
        onClose={() => setDetailOpen(false)}
      />
    </Modal>
  );
}
