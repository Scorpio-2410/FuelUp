// controllers/exerciseSearchController.js
const axios = require("axios");

const BASE = process.env.EXERCISEDB_BASE;
const HEADERS = {
  "x-rapidapi-key": process.env.EXERCISEDB_KEY,
  "x-rapidapi-host": process.env.EXERCISEDB_HOST,
};

function normalize(e) {
  // Map ExerciseDB fields → what your UI expects
  return {
    externalId: String(e.id),
    name: e.name,
    bodyPart: e.bodyPart,
    target: e.target,
    equipment: e.equipment,
    gifUrl: e.gifUrl,
    secondaryMuscles: e.secondaryMuscles || [],
    instructions: e.instructions || [],
  };
}

// Small helper to call ExerciseDB safely
async function callExerciseDB(path) {
  const url = `${BASE}${path}`;
  const r = await axios.get(url, { headers: HEADERS, timeout: 10000 });
  return r.data;
}

const ExerciseSearchController = {
  // GET /api/exercises/search?q=&bodyPart=&equipment=&target=&limit=&offset=
  // Strategy:
  // - If q present → use /exercises/name/{q}
  // - else if bodyPart → /exercises/bodyPart/{bodyPart}
  // - else if target → /exercises/target/{target}
  // - else if equipment → /exercises/equipment/{equipment}
  // - else → /exercises (full list), then paginate
  async search(req, res) {
    try {
      const q = (req.query.q || "").trim();
      const bodyPart = (req.query.bodyPart || "").trim();
      const equipment = (req.query.equipment || "").trim();
      const target = (req.query.target || "").trim();
      const limit = Math.min(Number(req.query.limit || 20), 50);
      const offset = Math.max(Number(req.query.offset || 0), 0);

      let data;
      if (q) {
        data = await callExerciseDB(`/exercises/name/${encodeURIComponent(q)}`);
      } else if (bodyPart) {
        data = await callExerciseDB(
          `/exercises/bodyPart/${encodeURIComponent(bodyPart)}`
        );
      } else if (target) {
        data = await callExerciseDB(
          `/exercises/target/${encodeURIComponent(target)}`
        );
      } else if (equipment) {
        data = await callExerciseDB(
          `/exercises/equipment/${encodeURIComponent(equipment)}`
        );
      } else {
        data = await callExerciseDB(`/exercises`);
      }

      // Optional extra filtering if multiple filters come together
      const filtered = data.filter((e) => {
        if (bodyPart && e.bodyPart !== bodyPart) return false;
        if (equipment && e.equipment !== equipment) return false;
        if (target && e.target !== target) return false;
        if (q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      });

      const page = filtered.slice(offset, offset + limit).map(normalize);

      res.json({
        success: true,
        total: filtered.length,
        limit,
        offset,
        exercises: page,
      });
    } catch (e) {
      console.error("exercise.search error:", e?.response?.data || e.message);
      const status = e?.response?.status || 500;
      res
        .status(status)
        .json({ error: "Failed to search exercises (upstream)" });
    }
  },

  // GET /api/exercises/:externalId
  async getByExternalId(req, res) {
    try {
      const id = String(req.params.externalId).trim();
      const data = await callExerciseDB(
        `/exercises/exercise/${encodeURIComponent(id)}`
      );
      res.json({ success: true, exercise: normalize(data) });
    } catch (e) {
      console.error(
        "exercise.getByExternalId error:",
        e?.response?.data || e.message
      );
      const status = e?.response?.status === 404 ? 404 : 500;
      res.status(status).json({ error: "Exercise not found" });
    }
  },
};

module.exports = ExerciseSearchController;
