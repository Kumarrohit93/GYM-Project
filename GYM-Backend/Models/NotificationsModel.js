const mongoose = require("mongoose");

const notificationsSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

  message: {
    type: String,
    required: true,
  },

  read: {
    type: Boolean,
    default: false,
  },
});

const Notification = mongoose.model("Notification", notificationsSchema);

module.exports = Notification;
