const express = require("express");
const router = express.Router();
const { createNotification, getNotifications, markAsRead } = require("../Controllers/NotificationController");
const { verifyToken } = require("../Middleware/authMiddleware");

router.post("/", verifyToken, createNotification);
router.get("/:memberId", verifyToken, getNotifications);
router.put("/read/:id", verifyToken, markAsRead);

module.exports = router;
