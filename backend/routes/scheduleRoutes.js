const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/scheduleController");

router.post("/preferences", ctrl.upsertPreferences);
router.post("/events/sync", ctrl.syncEvents);
router.get("/suggestions", ctrl.getSuggestions);

module.exports = router;
