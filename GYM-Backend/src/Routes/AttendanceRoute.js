const express = require("express");
const router = express.Router();
const {
  checkIn,
  checkOut,
  todayAttendance,
  memberAttendance,
  getActiveQR,
  getGymConfig,
  saveGymConfig,
} = require("../Controllers/AttendanceController");
const {
  verifyToken,
  requireAdmin,
  assertSelfMemberOrAdmin,
  resolveAttendanceMember,
} = require("../Middleware/authMiddleware");

router.post("/checkin", verifyToken, resolveAttendanceMember, checkIn);
router.post("/checkout", verifyToken, resolveAttendanceMember, checkOut);
router.get("/today", verifyToken, requireAdmin, todayAttendance);
router.get("/member/:id", verifyToken, assertSelfMemberOrAdmin, memberAttendance);
router.get("/qr", verifyToken, requireAdmin, getActiveQR);
router.get("/config", verifyToken, getGymConfig);
router.post("/config", verifyToken, requireAdmin, saveGymConfig);

module.exports = router;
