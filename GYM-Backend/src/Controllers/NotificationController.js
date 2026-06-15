const Notification = require("../../Models/NotificationsModel");
const Member = require("../../Models/MemberModel");

const createNotification = async (req, res) => {
  try {
    const { memberId, title, message } = req.body;
    if (!memberId || !title || !message) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    const newNotification = new Notification({
      memberId,
      title,
      message,
      read: false,
    });
    await newNotification.save();

    return res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: newNotification,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error creating notification",
      error: err.message,
    });
  }
};

const getNotifications = async (req, res) => {
  try {
    const { memberId } = req.params;
    const notifications = await Notification.find({ memberId }).sort({ _id: -1 });
    return res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving notifications",
      error: err.message,
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error updating notification status",
      error: err.message,
    });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
};
