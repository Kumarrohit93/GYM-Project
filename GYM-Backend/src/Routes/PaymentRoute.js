const express = require("express");
const router = express.Router();
const { createPayment, getPayments, getMemberPayments } = require("../Controllers/PaymentController");
const { verifyToken, requireAdmin, assertSelfMemberOrAdmin } = require("../Middleware/authMiddleware");

router.post("/", verifyToken, requireAdmin, createPayment);
router.get("/", verifyToken, requireAdmin, getPayments);
router.get("/member/:memberId", verifyToken, assertSelfMemberOrAdmin, getMemberPayments);

module.exports = router;
