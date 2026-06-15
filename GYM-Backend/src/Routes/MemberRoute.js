const express = require("express");
const router = express.Router();
const {
  createMember,
  getAllMembers,
  getSingleMember,
  updateMember,
  deleteMember,
  memberLogin,
  getMemberAnalytics,
} = require("../Controllers/MemberController");
const { verifyToken, requireAdmin, assertSelfMemberOrAdmin } = require("../Middleware/authMiddleware");

router.post("/login", memberLogin);

router.post("/", verifyToken, requireAdmin, createMember);
router.get("/", verifyToken, requireAdmin, getAllMembers);
router.get("/:id", verifyToken, assertSelfMemberOrAdmin, getSingleMember);
router.get("/:id/analytics", verifyToken, assertSelfMemberOrAdmin, getMemberAnalytics);
router.put("/:id", verifyToken, requireAdmin, updateMember);
router.delete("/:id", verifyToken, requireAdmin, deleteMember);

module.exports = router;
