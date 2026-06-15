const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
        type: String,
        required: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
    },

    age: {
      type: Number,
    },

    height: {
      type: Number,
    },

    weight: {
      type: Number,
    },

    goal: {
      type: String,
      enum: [
        "muscle_gain",
        "fat_loss",
        "strength",
        "endurance",
        "general_fitness",
      ],
      default: "general_fitness",
    },

    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    injuries: {
      type: [String],
      default: [],
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },

    membershipType: {
      type: String,
      enum: ["monthly", "quarterly", "halfYearly", "yearly"],
      default: "monthly",
    },

    membershipExpiry: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    attendanceCount: {
      type: Number,
      default: 0,
    },

    lastVisit: {
      type: Date,
      default: null,
    },

    profileImage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Member", memberSchema);
