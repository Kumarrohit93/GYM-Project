const express = require("express");
const router = Router = express.Router();
const { addProgress, getProgress } = require("../Controllers/ProgressController");
const { verifyToken } = require("../Middleware/authMiddleware");

router.post("/", verifyToken, addProgress);
router.get("/:memberId", verifyToken, getProgress);

module.exports = router;
