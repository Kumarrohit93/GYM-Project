const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },

  date: {
    type: Date,
    default: Date.now,
  },

  status: {
    type: String,
    enum: ["completed", "Pending"],
    default: "Pending",
  },

  generatedByAI: {
    type: Boolean,
    default: false,
  },
});

const Workout = mongoose.model("Workout", workoutSchema);

module.exports = Workout;
