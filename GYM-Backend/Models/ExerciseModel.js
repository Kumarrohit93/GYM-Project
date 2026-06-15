const mongoose = require("mongoose");

const setSchema = new mongoose.Schema({
  setNumber: {
    type: Number,
    required: true,
  },
  targetReps: {
    type: Number,
    required: true,
  },
  actualReps: {
    type: Number,
    default: 0,
  },
  targetWeight: {
    type: Number,
    required: true,
  },
  actualWeight: {
    type: Number,
    default: 0,
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

const exerciseSchema = new mongoose.Schema({
  workoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workout",
    required: true,
  },
  excerciseName: {
    type: String,
    required: true,
  },
  restTime: {
    type: Number,
    required: true,
  },
  sets: [setSchema],
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

module.exports = Exercise;
