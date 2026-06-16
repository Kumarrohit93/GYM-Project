const express = require("express");
const router = express.Router();
const { getPing, getHealth } = require("../Controllers/HealthController");

router.get("/ping", getPing);
router.get("/health", getHealth);

module.exports = router;
