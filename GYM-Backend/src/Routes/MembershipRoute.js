const express = require("express");
const router = express.Router();
const { createMembership, renewMembership, getMembership, getAllMemberships, getAllPlans } = require("../Controllers/MembershipController");
const { verifyToken } = require("../Middleware/authMiddleware");

router.post("/", verifyToken, createMembership);
router.put("/:id", verifyToken, renewMembership);
router.get("/plans", verifyToken, getAllPlans);
router.get("/", verifyToken, getAllMemberships);
router.get("/:id", verifyToken, getMembership);

module.exports = router;
