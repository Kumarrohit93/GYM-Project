const mongoose = require("mongoose");

const gymConfigSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true,
    default: 0.0,
  },
  longitude: {
    type: Number,
    required: true,
    default: 0.0,
  },
  radius: {
    type: Number,
    required: true,
    default: 100, // Allowed radius in meters
  },
});

const GymConfig = mongoose.model("GymConfig", gymConfigSchema);

module.exports = GymConfig;
