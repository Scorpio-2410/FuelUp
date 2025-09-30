// routes/exerciseSearchRoutes.js
const express = require("express");
const C = require("../controllers/exerciseSearchController");

const router = express.Router();

router.get("/search", C.search);
router.get("/:externalId", C.getByExternalId);

module.exports = router;
