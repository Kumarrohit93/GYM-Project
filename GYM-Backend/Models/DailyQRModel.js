const mongoose = require("mongoose");

const dailyQRSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true,
    },
    token: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

dailyQRSchema.index({ date: 1 });
dailyQRSchema.index({ isActive: 1 });

const DailyQR = mongoose.model("DailyQR", dailyQRSchema);

module.exports = DailyQR;
