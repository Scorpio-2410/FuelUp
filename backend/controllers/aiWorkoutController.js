const OpenAI = require("openai");
const Exercise = require("../models/exercise");
// Canonical target tokens present in the DB — keep in sync with DB values
const MUSCLE_GROUPS = [
  "abductors",
  "abs",
  "adductors",
  "biceps",
  "calves",
  "cardiovascular system",
  "delts",
  "forearms",
  "glutes",
  "hamstrings",
  "lats",
  "levator scapulae",
  "pectorals",
  "quads",
  "serratus anterior",
  "traps",
  "triceps",
  "upper back",
];
// Lazily initialize OpenAI client only if an API key is present. Some environments (local dev/tests)
// may not have OPENAI_API_KEY set; avoid throwing at module load time.
let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (err) {
    // swallow so server can still start; runtime calls should check `openai`.
    console.warn("OpenAI client not initialized:", err && err.message);
    openai = null;
  }
}

// Map raw muscle_group strings to allowed focus labels
function mapMuscleGroupToFocus(muscleGroup, exercises) {
  const mg = (muscleGroup || "").toLowerCase();
  // Allowed focus names (prefer these exact strings)
  const allowed = [
    "Full Body",
    "Upper Body",
    "Lower Body",
    "Push (Chest/Shoulders/Triceps)",
    "Pull (Back/Biceps)",
    "Legs",
    "Chest",
    "Back",
    "Shoulders",
    "Arms",
    "Core & Abs",
    "Cardio & Conditioning",
    "Mobility & Recovery",
  ];

  if (mg.includes("full") || mg.includes("total") || mg === "general")
    return "Full Body";
  if (
    mg.includes("upper") ||
    mg.includes("shoulder") ||
    mg.includes("chest") ||
    mg.includes("trice")
  )
    return "Upper Body";
  if (
    mg.includes("lower") ||
    mg.includes("leg") ||
    mg.includes("quad") ||
    mg.includes("glute")
  )
    return "Lower Body";
  if (mg.includes("push") || mg.includes("chest") || mg.includes("trice"))
    return "Push (Chest/Shoulders/Triceps)";
  if (mg.includes("pull") || mg.includes("back") || mg.includes("bice"))
    return "Pull (Back/Biceps)";
  if (mg.includes("leg") || mg.includes("quad") || mg.includes("glute"))
    return "Legs";
  if (mg.includes("chest")) return "Chest";
  if (mg.includes("back")) return "Back";
  if (mg.includes("shoulder") || mg.includes("deltoid")) return "Shoulders";
  if (mg.includes("arm") || mg.includes("bice") || mg.includes("trice"))
    return "Arms";
  if (mg.includes("core") || mg.includes("ab") || mg.includes("abs"))
    return "Core & Abs";

  // fallback: infer from exercises distribution
  const counts = {};
  for (const ex of exercises || []) {
    const m = (ex.muscle_group || "").toLowerCase();
    counts[m] = (counts[m] || 0) + 1;
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (best) return mapMuscleGroupToFocus(best[0], []);
  return "Full Body";
}

function buildPlanName(daysPerWeek, goal, dayFocuses) {
  const d = Number(daysPerWeek) || 1;
  // normalize focuses and dedupe
  const focuses = Array.isArray(dayFocuses)
    ? Array.from(
        new Set(dayFocuses.map((f) => (f || "").trim()).filter(Boolean))
      )
    : [];

  if (d === 1) return `1-Day Full Body Routine`;

  // 2-day and 3-day have common conventional names
  if (d === 2) return `${d}-Day Upper/Lower Split`;
  if (d === 3) return `${d}-Day Push/Pull/Legs Program`;

  // For 4 or 5 days try to build a descriptive name from the day's focuses when possible
  if (d === 4 || d === 5) {
    // If we have at least as many descriptive focuses as days, join them into the title
    const simpleFocuses = focuses.map((f) => f.replace(/\s+&\s+/g, " & "));
    if (simpleFocuses.length >= Math.min(d, 2)) {
      // take up to d focuses for the title
      const titleParts = simpleFocuses.slice(0, d);
      return `${d}-Day ${titleParts.join("/")} Split`;
    }

    // sensible defaults
    if (d === 4) return `${d}-Day Targeted Muscle Split`;
    return `${d}-Day Strength & Conditioning`;
  }

  // For 6+ days prefer a goal-driven name or a general program name
  if (d >= 6)
    return `${d}-Day ${
      goal ? goal.charAt(0).toUpperCase() + goal.slice(1) : "Training"
    } Program`;

  return `${d}-Day Program`;
}

// Return canonical planned focuses for a given daysPerWeek to ensure split coverage
function getPlannedFocuses(daysPerWeek) {
  const d = Number(daysPerWeek) || 1;
  if (d === 1) return ["Full Body"];
  if (d === 2) return ["Upper Body", "Lower Body"];
  if (d === 3)
    return ["Push (Chest/Shoulders/Triceps)", "Pull (Back/Biceps)", "Legs"];
  if (d === 4) return ["Chest", "Back", "Legs", "Shoulders"];
  if (d === 5) return ["Chest", "Back", "Legs", "Shoulders", "Arms"];
  if (d === 6)
    return ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core & Abs"];
  if (d === 7)
    return [
      "Chest",
      "Back",
      "Legs",
      "Shoulders",
      "Arms",
      "Core & Abs",
      "Cardio & Conditioning",
    ];
  return Array.from({ length: d }, (_, i) => `Day ${i + 1}`);
}

// Check if an exercise matches a target focus by inspecting muscle_group and secondary_muscles
// Normalize a token/string to canonical token used for target comparisons
function normalizeToken(s) {
  if (!s) return "";
  const t = String(s).toLowerCase();
  if (t.includes("ab") || t.includes("core") || t.includes("abdom"))
    return "core";
  if (t.includes("pect") || t.includes("chest")) return "pectorals";
  if (t.includes("lat") || t.includes("back")) return "back";
  if (t.includes("shoulder") || t.includes("deltoid")) return "deltoids";
  if (t.includes("bice")) return "biceps";
  if (t.includes("trice")) return "triceps";
  if (
    t.includes("leg") ||
    t.includes("quad") ||
    t.includes("glute") ||
    t.includes("calf")
  )
    return "legs";
  if (
    t.includes("cardio") ||
    t.includes("run") ||
    t.includes("bike") ||
    t.includes("row")
  )
    return "cardio";
  return t.replace(/[^a-z0-9]+/g, "");
}

function exerciseMatchesFocus(ex, focus) {
  if (!ex || !focus) return false;
  const f = (focus || "").toLowerCase();
  // Prefer explicit target field when available (more reliable)
  const targetField = (ex.target || "").toLowerCase();
  const normTarget = normalizeToken(targetField);
  const fields = [
    targetField,
    ex.muscle_group || "",
    ex.secondary_muscles || "",
    ex.name || "",
  ]
    .join(" ")
    .toLowerCase();
  // simple keyword matching heuristics
  const keywords = {
    chest: ["chest", "pector"],
    back: ["back", "lat", "lats", "trapezius", "trap", "rhomboid"],
    legs: ["leg", "quad", "hamstring", "glute", "calf", "adductor"],
    shoulders: ["shoulder", "deltoid", "delts"],
    arms: ["bice", "trice", "arm", "forearm", "wrist"],
    core: [
      "core",
      "ab",
      "abs",
      "abdom",
      "abdominal",
      "rectus",
      "transverse",
      "oblique",
      "obliques",
      "hip flexor",
      "stability",
      "stabilizer",
      "stabilizers",
    ],
    cardio: ["run", "bike", "row", "cardio", "conditioning", "treadmill"],
    upper: ["chest", "back", "shoulder", "arm", "bice", "trice"],
    lower: ["leg", "quad", "hamstring", "glute", "calf"],
    push: ["chest", "shoulder", "trice"],
    pull: ["back", "bice", "rear deltoid", "rear deltoids"],
  };

  const map = {
    "full body": ["chest", "back", "leg", "shoulder", "arm", "core"],
    fullbody: ["chest", "back", "leg", "shoulder", "arm", "core"],
  };

  // map focus to keyword set
  let keys = [];
  // quick wins: if normalized target matches a focus token, short-circuit true
  if (normTarget) {
    if (
      (f.includes("core") && normTarget === "core") ||
      (f.includes("chest") && normTarget === "pectorals") ||
      (f.includes("back") && normTarget === "back") ||
      (f.includes("shoulder") && normTarget === "deltoids") ||
      (f.includes("arm") &&
        (normTarget === "biceps" ||
          normTarget === "triceps" ||
          normTarget === "forearms")) ||
      (f.includes("leg") && normTarget === "legs") ||
      (f.includes("cardio") && normTarget === "cardio")
    ) {
      return true;
    }
  }
  if (f.includes("full")) keys = map["full body"];
  else if (f.includes("upper")) keys = keywords.upper;
  else if (f.includes("lower")) keys = keywords.lower;
  else if (f.includes("push")) keys = keywords.push;
  else if (f.includes("pull")) keys = keywords.pull;
  else if (f.includes("chest")) keys = keywords.chest;
  else if (f.includes("back")) keys = keywords.back;
  else if (f.includes("leg") || f.includes("legs")) keys = keywords.legs;
  else if (f.includes("shoulder")) keys = keywords.shoulders;
  else if (f.includes("arm")) keys = keywords.arms;
  else if (f.includes("core")) keys = keywords.core;
  else if (f.includes("cardio")) keys = keywords.cardio;

  // if any keyword appears in the fields string, consider it a match
  for (const k of keys) {
    if (fields.includes(k)) return true;
  }
  return false;
}

// Looser matching used for the fallback fill: returns true if the candidate contains
// any looser indicator that it may be relevant to the focus (partial matches, secondary muscles, etc.)
function looseMatchesFocus(ex, focus) {
  if (!ex || !focus) return false;
  const f = (focus || "").toLowerCase();
  const text = [
    ex.target || "",
    ex.muscle_group || "",
    ex.secondary_muscles || "",
    ex.name || "",
  ]
    .join(" ")
    .toLowerCase();

  // If exact match succeeded, that's already handled by exerciseMatchesFocus, but this
  // function is for looser cues: check for any focus token appearing in any field
  // using a small synonym map
  const synonyms = {
    core: [
      "core",
      "ab",
      "abs",
      "abdom",
      "abdominal",
      "rectus",
      "transverse",
      "oblique",
      "hip flexor",
      "stability",
    ],
    full: ["full", "total", "whole body", "entire body"],
    cardio: [
      "cardio",
      "conditioning",
      "hiit",
      "row",
      "run",
      "bike",
      "treadmill",
    ],
  };

  if (f.includes("core") || f.includes("abs")) {
    for (const s of synonyms.core) if (text.includes(s)) return true;
  }
  if (f.includes("full")) {
    for (const s of synonyms.full) if (text.includes(s)) return true;
  }
  if (f.includes("cardio") || f.includes("conditioning")) {
    for (const s of synonyms.cardio) if (text.includes(s)) return true;
  }

  // final fallback: any overlap of small tokens
  const tokens = f.split(/[^a-z0-9]+/).filter(Boolean);
  for (const t of tokens) {
    if (t.length < 3) continue;
    if (text.includes(t)) return true;
  }
  return false;
}

// Map high-level focus to likely target tokens stored in exercises.target
function focusToTargetTokens(focus) {
  const f = (focus || "").toLowerCase();
  if (f.includes("core") || f.includes("abs"))
    return [
      "core",
      "abdominals",
      "abs",
      "rectus",
      "transverse",
      "oblique",
      "obliques",
    ];
  // handle generic upper/lower body focuses
  if (f.includes("upper"))
    return ["pectorals", "back", "deltoids", "biceps", "triceps"];
  if (f.includes("lower") || f.includes("leg"))
    return [
      "quadriceps",
      "hamstrings",
      "glutes",
      "calves",
      "adductors",
      "abductors",
      "legs",
    ];
  if (f.includes("chest")) return ["pectorals", "chest", "pec"];
  if (f.includes("back"))
    return ["back", "lat", "lats", "trapezius", "rhomboid"];
  if (f.includes("shoulder")) return ["deltoids", "deltoid", "shoulder"];
  if (f.includes("arm") || f.includes("bice") || f.includes("trice"))
    return ["biceps", "triceps", "forearms"];
  if (f.includes("leg") || f.includes("legs") || f.includes("quad"))
    return [
      "quadriceps",
      "hamstrings",
      "glutes",
      "calves",
      "adductors",
      "abductors",
      "legs",
    ];
  if (f.includes("full"))
    return [
      "core",
      "pectorals",
      "back",
      "quadriceps",
      "hamstrings",
      "deltoids",
      "biceps",
      "triceps",
    ];
  if (f.includes("cardio") || f.includes("conditioning"))
    return ["cardio", "conditioning", "hiit", "row", "run", "bike"];
  if (f.includes("push")) return ["pectorals", "deltoids", "triceps"];
  if (f.includes("pull")) return ["back", "biceps", "rear deltoid"];
  return [];
}

exports.suggestWorkoutWithExercises = async (req, res) => {
  const { goal, activityLevel, daysPerWeek, height, weight } = req.body;

  // Fetch exercises from the local DB
  let exercises = [];
  try {
    exercises = await Exercise.findAll(1000);
  } catch (err) {
    console.error("Failed to query exercises from DB", err);
    return res
      .status(500)
      .json({ error: "Failed to fetch exercises from database" });
  }

  // Reduce prompt size: allow optional filtering and sampling
  const maxExercises = Math.max(
    5,
    Math.min(
      100,
      parseInt(req.query.max_exercises || req.body.max_exercises || "30")
    )
  );
  // Optional comma-separated targets in query or array in body
  const targetsParam = req.query.targets || req.body.targets;
  let preferredTargets = [];
  if (typeof targetsParam === "string" && targetsParam.length) {
    preferredTargets = targetsParam
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  } else if (Array.isArray(targetsParam)) {
    preferredTargets = targetsParam
      .map((s) => String(s).trim().toLowerCase())
      .filter(Boolean);
  }

  // Minimal fields to reduce token usage
  const minimal = (e) => ({
    id: e.id,
    name: e.name,
    muscle_group: e.muscle_group,
    equipment: e.equipment,
    difficulty: e.difficulty,
    secondary_muscles: e.secondary_muscles,
    external_id: e.external_id || null,
  });

  // Build planned focuses early so we can bias sampling for required tokens
  const plannedFocuses = getPlannedFocuses(daysPerWeek);
  // tokens we ideally want represented in the sample (intersection with MUSCLE_GROUPS)
  const tokensNeededSet = new Set();
  for (const f of plannedFocuses) {
    for (const t of focusToTargetTokens(f)) {
      const lower = (t || "").toLowerCase();
      // only keep tokens that appear in canonical MUSCLE_GROUPS to avoid noise
      if (MUSCLE_GROUPS.includes(lower)) tokensNeededSet.add(lower);
    }
  }
  const tokensNeeded = Array.from(tokensNeededSet);

  // Prioritize exercises that match preferred targets (if any)
  let matching = [];
  let nonMatching = [];
  if (preferredTargets.length > 0) {
    const lowerName = (s) => (s || "").toLowerCase();
    exercises.forEach((e) => {
      const mg = (e.muscle_group || "").toLowerCase();
      const found = preferredTargets.some(
        (t) => mg.includes(t) || lowerName(e.name).includes(t)
      );
      if (found) matching.push(e);
      else nonMatching.push(e);
    });
  } else {
    // no preference: randomize the list a bit to avoid always sending same subset
    nonMatching = exercises.slice();
    // simple shuffle (Fisher-Yates)
    for (let i = nonMatching.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nonMatching[i], nonMatching[j]] = [nonMatching[j], nonMatching[i]];
    }
  }

  // Attempt to bias the sampled `selected` pool so there are examples for each needed token.
  // If Exercise.findByTarget is available, use it to fetch a small per-token sample.
  const selected = [];
  const samplePerToken = Math.max(
    1,
    Math.floor(Math.min(4, maxExercises / Math.max(1, tokensNeeded.length)))
  );
  if (typeof Exercise.findByTarget === "function" && tokensNeeded.length > 0) {
    for (const token of tokensNeeded) {
      try {
        const rows = await Exercise.findByTarget(token, samplePerToken);
        if (rows && rows.length) {
          selected.push(...rows);
        }
      } catch (err) {
        // ignore and continue
        console.warn("findByTarget failed for", token, err && err.message);
      }
    }
  }

  // Additionally, prefetch a very small sample for every canonical MUSCLE_GROUP so the
  // prompt contains at least one concrete example per canonical token. Keep this tiny
  // to limit prompt size (1 example per token by default).
  const exerciseSamples = {};
  try {
    const samplePerTokenAll = 1; // keep minimal to avoid large prompts
    if (typeof Exercise.findByTarget === "function") {
      for (const token of MUSCLE_GROUPS) {
        try {
          const rows = await Exercise.findByTarget(token, samplePerTokenAll);
          exerciseSamples[token] = (rows || []).map(minimal);
          // include these examples in the selected pool to bias model and the deterministic picker
          for (const r of rows || []) {
            if (!selected.find((s) => s.id === r.id)) selected.push(r);
          }
        } catch (err) {
          exerciseSamples[token] = [];
          console.warn("findByTarget failed for", token, err && err.message);
        }
      }
    }
  } catch (err) {
    console.warn("error building exerciseSamples", err && err.message);
  }

  // Fill remaining from matching/nonMatching as before
  const takeFromMatching = Math.ceil(maxExercises * 0.7);
  selected.push(
    ...matching
      .slice(0, takeFromMatching)
      .filter((e) => !selected.find((s) => s.id === e.id))
  );
  if (selected.length < maxExercises) {
    selected.push(
      ...nonMatching
        .filter((e) => !selected.find((s) => s.id === e.id))
        .slice(0, maxExercises - selected.length)
    );
  }

  const exerciseJsonList = selected.slice(0, maxExercises).map(minimal);

  // Build a compact per-token examples object to include in the prompt so the model
  // sees canonical token names and a tiny example for each.
  const exerciseSamplesForPrompt = {};
  for (const t of MUSCLE_GROUPS)
    exerciseSamplesForPrompt[t] = exerciseSamples[t] || [];

  // Use compact JSON.stringify to save tokens
  const profile = { goal, activityLevel, daysPerWeek, height, weight };
  const prompt = `You are a concise and strict fitness coach. Given the user's profile and the exact list of available exercises (compact JSON), produce a weekly workout plan that GUARANTEES full-body coverage across the chosen number of training days.

User profile: ${JSON.stringify(profile)}

Available exercises (compact JSON array): ${JSON.stringify(exerciseJsonList)}

Available target tokens (canonical): ${JSON.stringify(MUSCLE_GROUPS)}

Per-token example exercises (id, name, muscle_group): ${JSON.stringify(
    exerciseSamplesForPrompt
  )}

Rules (follow exactly):
1) Use ONLY exercises from the provided list. Do not invent or reference any exercise not present in the list.
2) Create exactly ${daysPerWeek} day objects in the "days" array.
3) Each day must include between 4 and 8 exercises (inclusive). Do NOT output fewer than 4 exercises for any day.
4) COVERAGE REQUIREMENT (MANDATORY): After the user completes all ${daysPerWeek} days, the plan MUST have trained the following major areas at least once: legs, chest, back, shoulders, arms (biceps or triceps), core/abs. If ${daysPerWeek} >= 6, include cardio/conditioning and mobility/recovery coverage as appropriate across the week.
   - If ${daysPerWeek} == 1: that single day must be a FULL BODY workout that includes exercises targeting legs, chest, back, shoulders, arms and core.
   - If ${daysPerWeek} is 2 or 3: use broad splits (e.g., Upper/Lower, Push/Pull/Legs) so that by the end of the week all major areas are covered.
   - If ${daysPerWeek} is 4 or 5: use targeted muscle-group splits (e.g., Chest/Back, Legs, Shoulders/Arms, Core) ensuring coverage across the week.
   - If ${daysPerWeek} == 7: assign each day one primary region (e.g., Chest, Back, Legs, Shoulders, Arms, Core, Cardio) so that all major areas are trained across the seven days.
5) Avoid repeating the same exercise multiple times in the week unless the provided exercise pool is too small; if repeats are necessary, space them on non-consecutive days.
6) Focus naming (MUST use exactly one of these strings):
   ["Full Body","Upper Body","Lower Body","Push (Chest/Shoulders/Triceps)","Pull (Back/Biceps)","Legs","Chest","Back","Shoulders","Arms","Core & Abs","Cardio & Conditioning","Mobility & Recovery"]
   - Each day's "focus" must be one of the above and must reflect the majority of exercises on that day.
7) For every exercise output these fields exactly: exercise_id (number), name (string), sets (integer), reps (string or number), rest_seconds (integer), estimated_seconds (integer), secondary_muscles (string|null), note (optional string).
8) Plan naming: produce a concise "plan_name" that reflects the days-per-week and the split (examples: "1-Day Full Body Routine", "3-Day Push/Pull/Legs Program", "5-Day Strength & Conditioning"). Avoid vague names such as "endurance plan".
9) Output MUST be valid JSON and match the schema below exactly. Do not include any explanatory text or markdown; return only the JSON.

Schema (exact):
{
  "plan_name": "string",
  "days": [
    {
      "day": "Day 1",
      "focus": "string (one of the allowed values)",
      "exercises": [
        {
          "exercise_id": number,
          "name": "string",
          "sets": number,
          "reps": "string or number",
          "rest_seconds": number,
          "estimated_seconds": number,
          "secondary_muscles": "string or null",
          "note": "string (optional)"
        }
      ],
      "estimated_minutes": number
    }
  ]
}

If constraints cannot be satisfied (for example the provided exercise list is too small), return a JSON object: { "error": "short reason" }.
`;
  // small heuristic to choose sets/reps/rest given a goal and exercise difficulty
  const heuristic = (ex) => {
    const g = (goal || "").toLowerCase();
    const diff = (
      ex && ex.difficulty ? String(ex.difficulty) : ""
    ).toLowerCase();
    let derivedSets = 3;
    let derivedReps = 10;
    let derivedRest = 60;

    if (g.includes("strength") || g.includes("power")) {
      derivedSets = 4;
      derivedReps = 5;
      derivedRest = 120;
    } else if (g.includes("endurance")) {
      derivedSets = 3;
      derivedReps = 18;
      derivedRest = 45;
    } else if (
      g.includes("hypertrophy") ||
      g.includes("muscle") ||
      g.includes("gain")
    ) {
      derivedSets = 3;
      derivedReps = 10;
      derivedRest = 60;
    } else {
      derivedSets = diff === "beginner" ? 2 : diff === "advanced" ? 4 : 3;
      derivedReps = diff === "beginner" ? 12 : diff === "advanced" ? 8 : 10;
      derivedRest = diff === "beginner" ? 60 : diff === "advanced" ? 90 : 60;
    }

    const timePerSetSec = Math.max(20, Math.round(derivedReps * 3));
    const estSeconds =
      derivedSets * timePerSetSec + (derivedSets - 1) * derivedRest;
    return {
      sets: derivedSets,
      reps: String(derivedReps),
      rest_seconds: derivedRest,
      estimated_seconds: estSeconds,
    };
  };

  // Number of exercises per day: allow override via query/body, default to 6, clamp between 4 and 8
  let exercisesPerDay = parseInt(
    req.query.exercises_per_day || req.body.exercises_per_day || "6",
    10
  );
  if (!Number.isFinite(exercisesPerDay) || isNaN(exercisesPerDay))
    exercisesPerDay = 6;
  exercisesPerDay = Math.max(4, Math.min(8, exercisesPerDay));

  // Build weekly plan deterministically from selected exercises
  const pool = selected.slice();
  // if pool smaller than needed, allow repeats but try to spread
  const totalNeeded = exercisesPerDay * Math.max(1, parseInt(daysPerWeek || 1));
  if (pool.length === 0)
    return res
      .status(400)
      .json({ error: "No exercises available to build a plan" });

  // create a rotation array that repeats pool as needed
  const rotation = [];
  while (rotation.length < totalNeeded) {
    // shuffle a copy of pool each pass to mix order
    const copy = pool.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    rotation.push(...copy);
    if (rotation.length > totalNeeded * 3) break; // safety
  }

  let plan = { plan_name: `${goal || "Custom"} plan`, days: [] };

  // determine planned focuses for each day (deterministic)
  // (plannedFocuses already computed earlier for sampling)

  // convert pool to a mutable list of remaining exercises
  // If the pool is smaller than totalNeeded we previously built a `rotation` that repeats/shuffles the pool
  // so use that rotation as the source to allow repeats and avoid leaving later days empty.
  const remaining = rotation.length ? rotation.slice() : pool.slice();

  for (let d = 0; d < Math.max(1, parseInt(daysPerWeek || 1)); d++) {
    const dayExercises = [];
    const dayMatchedTargets = new Set();
    const focus =
      plannedFocuses[d] ||
      plannedFocuses[plannedFocuses.length - 1] ||
      "Full Body";

    // first pass: pick exercises that match the day's planned focus
    const seenIds = new Set();
    // Prefer exact normalized target matches first
    const targetTokens = focusToTargetTokens(focus);
    if (targetTokens.length > 0) {
      for (
        let i = remaining.length - 1;
        i >= 0 && dayExercises.length < exercisesPerDay;
        i--
      ) {
        const candidate = remaining[i];
        const candTarget = (candidate.target || "").toLowerCase();
        if (!candTarget) continue;
        for (const t of targetTokens) {
          if (candTarget.includes(t)) {
            if (seenIds.has(candidate.id)) break;
            const filled = heuristic(candidate);
            let estimated_seconds = filled.estimated_seconds || 0;
            if (
              candidate.duration_min &&
              Number.isFinite(Number(candidate.duration_min))
            ) {
              estimated_seconds = Math.max(
                estimated_seconds,
                Math.round(Number(candidate.duration_min) * 60)
              );
            }
            estimated_seconds += 15;
            dayExercises.push({
              exercise_id: candidate.id,
              name: candidate.name,
              sets: filled.sets,
              reps: filled.reps,
              rest_seconds: filled.rest_seconds,
              estimated_seconds,
              secondary_muscles: candidate.secondary_muscles || null,
              external_id: candidate.external_id || null,
            });
            dayMatchedTargets.add(t);
            seenIds.add(candidate.id);
            remaining.splice(i, 1);
            break;
          }
        }
      }
    }

    // Then fallback to the previous heuristic match
    for (
      let i = remaining.length - 1;
      i >= 0 && dayExercises.length < exercisesPerDay;
      i--
    ) {
      const candidate = remaining[i];
      if (seenIds.has(candidate.id)) continue; // avoid duplicate in same day
      if (exerciseMatchesFocus(candidate, focus)) {
        const filled = heuristic(candidate);
        let estimated_seconds = filled.estimated_seconds || 0;
        if (
          candidate.duration_min &&
          Number.isFinite(Number(candidate.duration_min))
        ) {
          estimated_seconds = Math.max(
            estimated_seconds,
            Math.round(Number(candidate.duration_min) * 60)
          );
        }
        estimated_seconds += 15;
        dayExercises.push({
          exercise_id: candidate.id,
          name: candidate.name,
          sets: filled.sets,
          reps: filled.reps,
          rest_seconds: filled.rest_seconds,
          estimated_seconds,
          secondary_muscles: candidate.secondary_muscles || null,
          external_id: candidate.external_id || null,
        });
        // record a normalized matched target for traceability
        try {
          const candNorm = normalizeToken(
            candidate.target ||
              candidate.muscle_group ||
              candidate.secondary_muscles ||
              candidate.name
          );
          if (candNorm) dayMatchedTargets.add(candNorm);
        } catch (err) {
          /* ignore */
        }
        // mark as seen for this day and remove the used element from remaining
        seenIds.add(candidate.id);
        remaining.splice(i, 1);
      }
    }

    // second pass: fill with any remaining exercises if not enough matched
    // second pass: prefer loose matches (partial indicators) before taking arbitrary exercises
    let safety = 0;
    while (
      dayExercises.length < exercisesPerDay &&
      remaining.length > 0 &&
      safety++ < 1000
    ) {
      // try to find a loose match in the remaining queue
      let idx = remaining.findIndex(
        (c) => !seenIds.has(c.id) && looseMatchesFocus(c, focus)
      );
      if (idx === -1) {
        // if none found, pick first non-seen item
        idx = remaining.findIndex((c) => !seenIds.has(c.id));
      }
      if (idx === -1) break;
      const candidate = remaining.splice(idx, 1)[0];
      if (!candidate) break;
      // mark seen for this day
      const candNorm = normalizeToken(
        candidate.target ||
          candidate.muscle_group ||
          candidate.secondary_muscles ||
          candidate.name
      );
      // if candidate is a strong mismatch (e.g., forearms while focus=core), try to skip it for now
      const isStrongMismatch = (function () {
        if (!candNorm) return false;
        if (focus.toLowerCase().includes("core")) {
          return ["biceps", "triceps", "forearms"].includes(candNorm);
        }
        return false;
      })();
      if (isStrongMismatch) {
        // if there are other non-seen items, push this to back and continue
        if (
          remaining.some(
            (r) =>
              !seenIds.has(r.id) &&
              normalizeToken(
                r.target || r.muscle_group || r.secondary_muscles || r.name
              ) !== candNorm
          )
        ) {
          remaining.push(candidate);
          continue;
        }
        // otherwise accept it (no other options)
      }
      seenIds.add(candidate.id);
      const filled = heuristic(candidate);
      let estimated_seconds = filled.estimated_seconds || 0;
      if (
        candidate.duration_min &&
        Number.isFinite(Number(candidate.duration_min))
      ) {
        estimated_seconds = Math.max(
          estimated_seconds,
          Math.round(Number(candidate.duration_min) * 60)
        );
      }
      estimated_seconds += 15;
      dayExercises.push({
        exercise_id: candidate.id,
        name: candidate.name,
        sets: filled.sets,
        reps: filled.reps,
        rest_seconds: filled.rest_seconds,
        estimated_seconds,
        secondary_muscles: candidate.secondary_muscles || null,
        external_id: candidate.external_id || null,
      });
      // record normalized matched target from fallback pick
      try {
        const candNorm = normalizeToken(
          candidate.target ||
            candidate.muscle_group ||
            candidate.secondary_muscles ||
            candidate.name
        );
        if (candNorm) dayMatchedTargets.add(candNorm);
      } catch (err) {
        /* ignore */
      }
    }

    // Attempt to ensure at least 2 focus-matching exercises for Core & Abs days when possible
    if (focus.toLowerCase().includes("core")) {
      let coreMatchesCount = dayExercises.filter((ex) => {
        const nt = normalizeToken(
          ex && ex.secondary_muscles ? ex.secondary_muscles : ex.name
        );
        return (
          nt === "core" ||
          (ex && (ex.name || "").toLowerCase().includes("plank")) ||
          (ex.name || "").toLowerCase().includes("crunch")
        );
      }).length;
      if (coreMatchesCount < 2) {
        // try to swap in core-targeted exercises from remaining
        for (let i = 0; i < remaining.length && coreMatchesCount < 2; i++) {
          const cand = remaining[i];
          if (!cand) continue;
          const candNorm = normalizeToken(
            cand.target ||
              cand.muscle_group ||
              cand.secondary_muscles ||
              cand.name
          );
          if (candNorm === "core" || looseMatchesFocus(cand, focus)) {
            // replace the last non-core exercise in dayExercises
            const replaceIdx = dayExercises.findIndex((e) => {
              const en = normalizeToken(
                e && e.secondary_muscles ? e.secondary_muscles : e.name
              );
              return en !== "core";
            });
            if (replaceIdx !== -1) {
              const removed = dayExercises.splice(replaceIdx, 1)[0];
              // push removed back into remaining
              remaining.push({
                id: removed.exercise_id,
                name: removed.name,
                target: "",
                muscle_group: "",
                secondary_muscles: "",
              });
              // insert new candidate
              const filled = heuristic(cand);
              const newEst = filled.estimated_seconds || 0;
              dayExercises.push({
                exercise_id: cand.id,
                name: cand.name,
                sets: filled.sets,
                reps: filled.reps,
                rest_seconds: filled.rest_seconds,
                estimated_seconds: newEst,
                secondary_muscles: cand.secondary_muscles || null,
                external_id: cand.external_id || null,
              });
              // record matched target for the swapped-in candidate
              try {
                const candNorm = normalizeToken(
                  cand.target ||
                    cand.muscle_group ||
                    cand.secondary_muscles ||
                    cand.name
                );
                if (candNorm) dayMatchedTargets.add(candNorm);
              } catch (err) {
                /* ignore */
              }
              coreMatchesCount++;
              // remove used candidate
              remaining.splice(i, 1);
              i--;
            }
          }
        }
      }
    }

    // sum estimated seconds for the day and round up to nearest 5 minutes
    const totalSeconds = dayExercises.reduce(
      (s, x) => s + (x.estimated_seconds || 0),
      0
    );
    const minutes = Math.ceil(totalSeconds / 60);
    const rounded = Math.ceil(minutes / 5) * 5;

    // map the planned focus to one of the allowed focus strings (safe)
    let mappedFocus = mapMuscleGroupToFocus(focus, dayExercises);
    if (Number(daysPerWeek) === 1) mappedFocus = "Full Body";

    plan.days.push({
      day: `Day ${d + 1}`,
      focus: mappedFocus,
      exercises: dayExercises,
      estimated_minutes: rounded,
      matched_targets: Array.from(dayMatchedTargets),
    });
  }

  // Build a clearer plan_name based on daysPerWeek and focuses
  const dayFocuses = plan.days.map((dd) => dd.focus);
  plan.plan_name = buildPlanName(daysPerWeek, goal, dayFocuses);

  // Strict validation & repair: ensure the plan uses only provided exercises and meets coverage rules.
  function validateAndRepairPlan(planObj, availableExercises) {
    // availableExercises: array of exercise objects (full records)
    const byId = new Map(availableExercises.map((e) => [Number(e.id), e]));

    // helper to compute normalized tokens present in an exercise
    const tokensForExercise = (ex) => {
      const t = normalizeToken(
        ex.target || ex.muscle_group || ex.secondary_muscles || ex.name || ""
      );
      return t || null;
    };

    // Ensure day count
    const expectedDays = Math.max(1, Number(daysPerWeek) || 1);
    if (!Array.isArray(planObj.days) || planObj.days.length !== expectedDays) {
      return { error: `Plan must contain exactly ${expectedDays} days` };
    }

    // Track coverage across week
    const coverage = new Set();

    for (const day of planObj.days) {
      if (!Array.isArray(day.exercises))
        return { error: "Invalid day.exercises" };
      if (day.exercises.length < 4 || day.exercises.length > 8)
        return { error: `Each day must have between 4 and 8 exercises` };

      for (let i = 0; i < day.exercises.length; i++) {
        const it = day.exercises[i];
        const eid = Number(it.exercise_id);
        if (!byId.has(eid)) {
          // replace with a matching available exercise if possible
          // try to find one that matches the day's focus
          const focus = day.focus || "";
          const candidateIdx = availableExercises.findIndex((ae) => {
            return exerciseMatchesFocus(ae, focus);
          });
          if (candidateIdx !== -1) {
            const cand = availableExercises.splice(candidateIdx, 1)[0];
            day.exercises[i].exercise_id = cand.id;
            day.exercises[i].name = cand.name;
            day.exercises[i].secondary_muscles = cand.secondary_muscles || null;
            // record token
            const tk = tokensForExercise(cand);
            if (tk) coverage.add(tk);
            continue;
          }
          // if no candidate, return error
          return { error: `Exercise id ${eid} not available in provided pool` };
        }
        const source = byId.get(eid);
        const tk = tokensForExercise(source);
        if (tk) coverage.add(tk);
      }
    }

    // Required coverage tokens
    const required = [
      "legs",
      "pectorals",
      "back",
      "deltoids",
      "biceps",
      "triceps",
      "core",
    ];
    // Consider synonyms: if 'pectorals' missing but 'chest' present, that's fine; normalizeToken returns canonical forms used above.
    const missing = required.filter(
      (r) =>
        !Array.from(coverage).some(
          (c) => (c && c.includes(r.slice(0, 3))) || c === r
        )
    );
    if (missing.length > 0) {
      // attempt to repair by swapping in available exercises matching missing tokens
      for (const m of missing) {
        const candidateIdx = availableExercises.findIndex((ae) => {
          const nt = tokensForExercise(ae);
          return (
            nt &&
            (nt === m ||
              nt.includes(m) ||
              (m === "pectorals" && nt === "pectorals"))
          );
        });
        if (candidateIdx !== -1) {
          const cand = availableExercises.splice(candidateIdx, 1)[0];
          // insert into first day that doesn't already contain that token
          for (const day of planObj.days) {
            const dayHas = day.exercises.some((ex) => {
              const eid = Number(ex.exercise_id);
              const src = byId.get(eid);
              return (
                src &&
                normalizeToken(
                  src.target ||
                    src.muscle_group ||
                    src.secondary_muscles ||
                    src.name
                ) ===
                  normalizeToken(
                    cand.target ||
                      cand.muscle_group ||
                      cand.secondary_muscles ||
                      cand.name
                  )
              );
            });
            if (!dayHas) {
              // replace a non-matching exercise if possible
              const replaceIdx = day.exercises.findIndex((ex) => {
                const s = byId.get(Number(ex.exercise_id));
                if (!s) return true;
                const nt = normalizeToken(
                  s.target || s.muscle_group || s.secondary_muscles || s.name
                );
                return (
                  nt &&
                  nt !==
                    normalizeToken(
                      cand.target ||
                        cand.muscle_group ||
                        cand.secondary_muscles ||
                        cand.name
                    )
                );
              });
              if (replaceIdx !== -1) {
                day.exercises[replaceIdx] = {
                  exercise_id: cand.id,
                  name: cand.name,
                  sets: 3,
                  reps: "10",
                  rest_seconds: 60,
                  estimated_seconds: 120,
                  secondary_muscles: cand.secondary_muscles || null,
                  external_id: cand.external_id || null,
                };
                coverage.add(
                  normalizeToken(
                    cand.target ||
                      cand.muscle_group ||
                      cand.secondary_muscles ||
                      cand.name
                  )
                );
                break;
              }
            }
          }
        }
      }
    }

    // Return repaired plan
    return { plan: planObj };
  }

  const validated = validateAndRepairPlan(
    plan,
    selected.slice(0, maxExercises)
  );
  if (validated && validated.error) {
    return res.status(500).json({ error: validated.error });
  }
  if (validated.plan) plan = validated.plan;

  return res.json({ workout: plan });
};
