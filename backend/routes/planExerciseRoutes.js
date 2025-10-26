// backend/routes/planExerciseRoutes.js
const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });
router.use(authenticateToken);

const T_PLANS = "fitness_plans";
const T_PLAN_EXERCISES = "fitness_plan_exercises";

async function assertUserOwnsPlan(userId, planId) {
  const { rows } = await pool.query(
    `SELECT id FROM ${T_PLANS} WHERE id=$1 AND user_id=$2 LIMIT 1`,
    [planId, userId]
  );
  return rows.length > 0;
}

/** List exercises in a plan */
router.get("/", async (req, res) => {
  const planId = Number(req.params.id);
  if (!planId) return res.status(400).json({ error: "plan id required" });

  try {
    if (!(await assertUserOwnsPlan(req.userId, planId)))
      return res.status(404).json({ error: "Plan not found" });

    // Join to local exercises where possible to pull secondary_muscles.
    // p.external_id may contain either the local numeric id (stored as text)
    // or the upstream external_id string; match both.
    const { rows } = await pool.query(
      `SELECT p.id,
              p.plan_id     AS "planId",
              p.source,
              p.external_id AS "externalId",
              p.name,
              p.gif_url     AS "gifUrl",
              p.body_part   AS "bodyPart",
              p.target,
              p.equipment,
              p.added_at    AS "addedAt",
              e.secondary_muscles AS "secondaryMuscles"
         FROM ${T_PLAN_EXERCISES} p
         LEFT JOIN exercises e ON (e.id::text = p.external_id OR e.external_id = p.external_id)
        WHERE p.plan_id=$1
        ORDER BY p.added_at DESC`,
      [planId]
    );
    res.json({ success: true, items: rows });
  } catch (e) {
    console.error("list plan exercises error:", e);
    res.status(500).json({ error: "Failed to fetch plan exercises" });
  }
});

/** Add an exercise to a plan (idempotent by plan_id+source+external_id) */
router.post("/", async (req, res) => {
  const planId = Number(req.params.id);
  const {
    externalId,
    name,
    source = "exercisedb",
    gifUrl = null,
    bodyPart = null,
    target = null,
    equipment = null,
  } = req.body || {};

  if (!planId) return res.status(400).json({ error: "plan id required" });
  if (!externalId || !name)
    return res.status(400).json({ error: "externalId and name are required" });

  try {
    if (!(await assertUserOwnsPlan(req.userId, planId)))
      return res.status(404).json({ error: "Plan not found" });

    const ins = await pool.query(
      `INSERT INTO ${T_PLAN_EXERCISES}
         (plan_id, source, external_id, name, gif_url, body_part, target, equipment)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (plan_id, source, external_id)
       DO UPDATE SET name=EXCLUDED.name, gif_url=EXCLUDED.gif_url,
                     body_part=EXCLUDED.body_part, target=EXCLUDED.target,
                     equipment=EXCLUDED.equipment
       RETURNING id, plan_id AS "planId", source, external_id AS "externalId",
                 name, gif_url AS "gifUrl", body_part AS "bodyPart",
                 target, equipment, added_at AS "addedAt"`,
      [planId, source, externalId, name, gifUrl, bodyPart, target, equipment]
    );

    // If the added item references a local exercise, attempt to fetch
    // additional metadata (like secondary_muscles) from the exercises table
    const item = ins.rows[0];
    try {
      if ((item.source || "").toLowerCase() === "local") {
        // externalId may be a numeric local id or the upstream external_id string.
        const maybeNum = Number(item.externalId);
        let exq;
        if (Number.isFinite(maybeNum)) {
          exq = await pool.query(
            `SELECT secondary_muscles FROM exercises WHERE id=$1 LIMIT 1`,
            [maybeNum]
          );
        } else {
          exq = await pool.query(
            `SELECT secondary_muscles FROM exercises WHERE external_id=$1 LIMIT 1`,
            [String(item.externalId)]
          );
        }
        if (exq && exq.rows && exq.rows[0]) {
          item.secondaryMuscles = exq.rows[0].secondary_muscles;
        } else {
          item.secondaryMuscles = null;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch local exercise metadata", err);
      item.secondaryMuscles = null;
    }

    res.status(201).json({ success: true, item });
  } catch (e) {
    console.error("add plan exercise error:", e);
    res.status(500).json({ error: "Failed to add exercise to plan" });
  }
});

/** Remove by row id */
router.delete("/:itemId", async (req, res) => {
  const planId = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  if (!planId || !itemId)
    return res.status(400).json({ error: "plan id and item id required" });

  try {
    if (!(await assertUserOwnsPlan(req.userId, planId)))
      return res.status(404).json({ error: "Plan not found" });

    await pool.query(
      `DELETE FROM ${T_PLAN_EXERCISES} WHERE id=$1 AND plan_id=$2`,
      [itemId, planId]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("delete plan exercise error:", e);
    res.status(500).json({ error: "Failed to remove exercise" });
  }
});

module.exports = router;
