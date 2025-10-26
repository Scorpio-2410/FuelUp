#!/usr/bin/env node
const axios = require("axios");
const path = require("path");
let Exercise;
try {
  Exercise = require(path.join(__dirname, "..", "models", "exercise"));
} catch (err) {
  console.error(
    "Failed to load Exercise model from",
    path.join(__dirname, "..", "models", "exercise")
  );
  throw err;
}

// Muscle groups mirror frontend TargetFilterBar.MUSCLE_GROUPS
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

const BASE = "http://localhost:4000";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchByTarget(target) {
  const q = encodeURIComponent(target);
  const url = `${BASE}/api/exercises?target=${q}`;
  const res = await axios.get(url, { timeout: 20000 });
  return Array.isArray(res.data?.items) ? res.data.items : [];
}

function mapUpstream(it) {
  const instructionsText = Array.isArray(it.instructions)
    ? it.instructions.join("\n")
    : it.instructions || it.description || "";
  const secondary = Array.isArray(it.secondaryMuscles)
    ? it.secondaryMuscles.join(", ")
    : it.secondaryMuscles || "";
  return {
    name: it.name || it.exercise || "",
    muscle_group: it.bodyPart || it.muscle_group || it.target || null,
    target: it.target || it.bodyPart || it.muscle_group || null,
    equipment: it.equipment || null,
    difficulty: it.difficulty || it.level || it.difficultyLevel || null,
    secondary_muscles: secondary || null,
    category: it.category || null,
    external_id: it.id ? String(it.id) : null,
    gif_url: it.gifUrl || null,
    video_url: it.video || it.videoUrl || null,
    image_url: it.image || it.imageUrl || null,
    notes: instructionsText || null,
  };
}

async function importGroup(target) {
  try {
    const items = await fetchByTarget(target);
    console.log(`Fetched ${items.length} items for target='${target}'`);
    let inserted = 0;
    let updated = 0;
    for (const it of items) {
      const ex = mapUpstream(it);
      const existing = await Exercise.findByNameAndGroup(
        ex.name,
        ex.muscle_group
      );
      if (existing) {
        await Exercise.updateById(existing.id, ex);
        updated++;
      } else {
        await Exercise.create(ex);
        inserted++;
      }
    }
    console.log(
      `Target='${target}' => inserted=${inserted}, updated=${updated}`
    );
    return { inserted, updated, total: items.length };
  } catch (err) {
    console.error(`Failed import for target='${target}':`, err?.message || err);
    return { inserted: 0, updated: 0, total: 0, error: err?.message };
  }
}

async function run() {
  console.log("Starting import by muscle group...");
  let totalInserted = 0;
  let totalUpdated = 0;
  for (const g of MUSCLE_GROUPS) {
    // RapidAPI may use slightly different target strings; consider normalizing if counts are 0
    const res = await importGroup(g);
    totalInserted += res.inserted || 0;
    totalUpdated += res.updated || 0;
    // short pause to avoid hitting rate limits
    await sleep(600);
  }
  console.log(
    `Import complete. Total inserted=${totalInserted}, updated=${totalUpdated}`
  );
  process.exit(0);
}

run().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
