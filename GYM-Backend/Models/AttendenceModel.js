const mongoose = require("mongoose");

const attendenceSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  checkInTime: {
    type: Date,
  },
  checkOutTime: {
    type: Date,
  },
  duration: {
    type: Number,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
});

attendenceSchema.index({ memberId: 1, date: -1 });
attendenceSchema.index({ memberId: 1, checkOutTime: 1 });

const Attendence = mongoose.model("Attendence", attendenceSchema);

module.exports = Attendence;
