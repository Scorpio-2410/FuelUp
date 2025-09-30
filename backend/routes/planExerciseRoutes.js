// routes/planExerciseRoutes.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const C = require("../controllers/planExerciseController");

const router = express.Router({ mergeParams: true });
router.use(authenticateToken);

router.get("/", C.list);
router.post("/", C.add);
router.delete("/:externalId", C.remove);

module.exports = router;
