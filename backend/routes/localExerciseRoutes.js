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
    return res.json({ item: ex });
  } catch (e) {
    console.error("local exercise detail error", e);
    return res.status(500).json({ error: "Failed to fetch exercise" });
  }
});

module.exports = router;
