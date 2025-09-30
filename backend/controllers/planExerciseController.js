// controllers/planExerciseController.js
const PlanExercise = require("../models/planExercise");
const FitnessPlan = require("../models/fitnessPlan");
const axios = require("axios");

const BASE = process.env.EXERCISEDB_BASE;
const HEADERS = {
  "x-rapidapi-key": process.env.EXERCISEDB_KEY,
  "x-rapidapi-host": process.env.EXERCISEDB_HOST,
};

const normalize = (e) => ({
  externalId: String(e.id),
  name: e.name,
  bodyPart: e.bodyPart,
  target: e.target,
  equipment: e.equipment,
  gifUrl: e.gifUrl,
});

async function fetchExercise(externalId) {
  const { data } = await axios.get(
    `${BASE}/exercises/exercise/${encodeURIComponent(externalId)}`,
    { headers: HEADERS, timeout: 10000 }
  );
  return normalize(data);
}

// POST /api/fitness/plans/:id/exercises { externalId }
async function add(req, res) {
  try {
    const plan = await FitnessPlan.findById(req.params.id);
    if (!plan || plan.userId !== req.userId)
      return res.status(404).json({ error: "Plan not found" });

    const e = await fetchExercise(req.body.externalId);
    const added = await PlanExercise.addToPlan(plan.id, e);
    return res.status(201).json({ success: true, added: !!added });
  } catch (err) {
    const status = err?.response?.status || 500;
    return res.status(status).json({ error: "Failed to add exercise" });
  }
}

// GET /api/fitness/plans/:id/exercises
async function list(req, res) {
  try {
    const plan = await FitnessPlan.findById(req.params.id);
    if (!plan || plan.userId !== req.userId)
      return res.status(404).json({ error: "Plan not found" });

    const items = await PlanExercise.list(plan.id, {
      limit: Number(req.query.limit || 200),
      offset: Number(req.query.offset || 0),
    });
    res.json({ success: true, exercises: items });
  } catch (e) {
    res.status(500).json({ error: "Failed to list exercises" });
  }
}

// DELETE /api/fitness/plans/:id/exercises/:externalId
async function remove(req, res) {
  try {
    const plan = await FitnessPlan.findById(req.params.id);
    if (!plan || plan.userId !== req.userId)
      return res.status(404).json({ error: "Plan not found" });

    await PlanExercise.remove(plan.id, req.params.externalId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to remove exercise" });
  }
}

module.exports = { add, list, remove };
