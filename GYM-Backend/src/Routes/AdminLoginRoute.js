const express = require("express");
const router = express.Router();
const { adminLogin, getAdminProfile } = require("../Controllers/AdminLoginController");
const { verifyToken } = require("../Middleware/authMiddleware");

router.post("/login", adminLogin);
router.get("/profile", verifyToken, getAdminProfile);

module.exports = router;
