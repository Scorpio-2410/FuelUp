// backend/routes/exerciseSearchRoutes.js
const express = require("express");
const axios = require("axios");

const router = express.Router();

const BASE = process.env.EXERCISEDB_BASE || "https://exercisedb.p.rapidapi.com";
const KEY = process.env.EXERCISEDB_KEY || process.env.RAPIDAPI_KEY || "";
const HOST = process.env.EXERCISEDB_HOST || "exercisedb.p.rapidapi.com";

if (!KEY) {
  console.warn(
    "[exerciseSearchRoutes] WARNING: EXERCISEDB_KEY / RAPIDAPI_KEY is not set. Requests will fail."
  );
}

/**
 * GET /api/exercises
 * If ?target=<muscle> is provided, proxy ExerciseDB /exercises/target/{target}
 * Else returns the full list.
 */
router.get("/", async (req, res) => {
  // make target case-insensitive and trimmed
  const target = String(req.query.target || "")
    .trim()
    .toLowerCase();
  const upstreamPath = target
    ? `/exercises/target/${encodeURIComponent(target)}`
    : `/exercises`;

  try {
    const resp = await axios({
      method: "GET",
      url: `${BASE}${upstreamPath}`,
      headers: { "x-rapidapi-key": KEY, "x-rapidapi-host": HOST },
      timeout: 20000,
    });

    const items = Array.isArray(resp.data) ? resp.data : [];
    return res.json({ items });
  } catch (err) {
    console.error("ExerciseDB search error:", err?.message || err);
    return res.status(500).json({ error: "Failed to fetch exercises" });
  }
});

/** IMAGE (must be before /:id) */
router.get("/:id/image", async (req, res) => {
  const exerciseId = String(req.params.id || "").trim();
  const resolution = String(req.query.resolution || "180").trim();
  if (!exerciseId)
    return res.status(400).json({ error: "exerciseId required" });

  try {
    const resp = await axios({
      method: "GET",
      url: `${BASE}/image`,
      headers: { "x-rapidapi-key": KEY, "x-rapidapi-host": HOST },
      params: { resolution, exerciseId },
      responseType: "arraybuffer",
      maxRedirects: 3,
      timeout: 20000,
    });

    res.set("Content-Type", "image/gif");
    res.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
    res.set("Access-Control-Expose-Headers", "Content-Type, Cache-Control");
    return res.status(200).send(Buffer.from(resp.data));
  } catch (err) {
    console.error("ExerciseDB image error:", err?.message || err);
    return res
      .status(422)
      .json({ error: "Failed to fetch image from ExerciseDB" });
  }
});

/** DETAIL */
router.get("/:id", async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!id) return res.status(400).json({ error: "id required" });

  try {
    const resp = await axios({
      method: "GET",
      url: `${BASE}/exercises/exercise/${encodeURIComponent(id)}`,
      headers: { "x-rapidapi-key": KEY, "x-rapidapi-host": HOST },
      timeout: 20000,
    });

    const item = resp.data;
    if (!item || !item.id)
      return res.status(404).json({ error: "Exercise not found" });
    return res.json({ item });
  } catch (err) {
    const status = err?.response?.status || 500;
    console.error("ExerciseDB detail error:", err?.message || status);
    return res
      .status(status)
      .json({ error: "Failed to fetch exercise detail" });
  }
});

module.exports = router;
