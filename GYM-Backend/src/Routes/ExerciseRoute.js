const express = require("express");
const router = express.Router();
const { createExercise, getExercises, updateExercise, deleteExercise } = require("../Controllers/ExerciseController");
const { verifyToken } = require("../Middleware/authMiddleware");

router.post("/", verifyToken, createExercise);
router.get("/", verifyToken, getExercises);
router.put("/:id", verifyToken, updateExercise);
router.delete("/:id", verifyToken, deleteExercise);

module.exports = router;
