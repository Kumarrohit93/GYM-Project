const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },

  date: {
    type: Date,
    required: true,
  },

  weight: {
    type: Number,
    required: true,
  },

  bodyFatPercentage: {
    type: Number,
    required: true,
  },

  chest: {
    type: Number,
    required: true,
  },

  waist: {
    type: Number,
    required: true,
  },

  arms: {
    type: Number,
    required: true,
  },

  thighs: {
    type: Number,
    required: true,
  },
});

const Progress = mongoose.model("Progress", progressSchema);

module.exports = Progress;
