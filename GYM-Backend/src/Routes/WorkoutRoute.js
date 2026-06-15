const express = require("express");
const router = express.Router();
const { generateWorkout, getTodayWorkout, getWorkoutHistory } = require("../Controllers/WorkoutController");
const { verifyToken, requireAdmin, assertSelfMemberOrAdmin } = require("../Middleware/authMiddleware");

router.post("/generate", verifyToken, assertSelfMemberOrAdmin, generateWorkout);
router.get("/today/:memberId", verifyToken, assertSelfMemberOrAdmin, getTodayWorkout);
router.get("/history/:memberId", verifyToken, assertSelfMemberOrAdmin, getWorkoutHistory);

module.exports = router;
