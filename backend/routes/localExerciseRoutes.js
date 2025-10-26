const express = require("express");
const Exercise = require("../models/exercise");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
router.use(authenticateToken);

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "id required" });
  try {
    const ex = await Exercise.findById(id);
    if (!ex) return res.status(404).json({ error: "Exercise not found" });

    // Normalize to a shape closer to the public ExerciseDB response so the
    // frontend detail modal can render images and instructions consistently.
    const instructions = ex.notes
      ? String(ex.notes)
          .split(/\r?\n+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const item = {
      // keep original properties
      ...ex,
      // add friendly aliases expected by the app UI
      bodyPart: ex.muscle_group || null,
      gifUrl: ex.gif_url || null,
      imageUrl: ex.image_url || null,
      instructions,
    };

    return res.json({ item });
  } catch (e) {
    console.error("local exercise detail error", e);
    return res.status(500).json({ error: "Failed to fetch exercise" });
  }
});

module.exports = router;
