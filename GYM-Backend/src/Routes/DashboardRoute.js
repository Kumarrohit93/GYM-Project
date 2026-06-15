const express = require("express");
const router = express.Router();
const { getStats } = require("../Controllers/DashboardController");
const { verifyToken, requireAdmin } = require("../Middleware/authMiddleware");

router.get("/stats", verifyToken, requireAdmin, getStats);

module.exports = router;
