const Attendance = require("../../Models/AttendenceModel");
const Member = require("../../Models/MemberModel");
const GymConfig = require("../../Models/GymConfigModel");
const calculateWorkoutDuration = require("../Utils/calculateWorkoutDuration");
const { ensureDailyQR, validateQRToken, getDailyQRCodeToken } = require("../Utils/qrTokenUtils");

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const isMembershipBlocked = (member) => {
  const now = new Date();
  return (
    member.status === "inactive" ||
    member.status === "suspended" ||
    (member.membershipExpiry && new Date(member.membershipExpiry) < now)
  );
};

const checkIn = async (req, res) => {
  try {
    const memberId = req.userType === "member"
      ? req.member._id.toString()
      : req.body.memberId;
    const { qrToken, latitude, longitude } = req.body;

    if (!memberId) {
      return res.status(400).json({ success: false, message: "Member ID is required" });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    if (isMembershipBlocked(member)) {
      return res.status(400).json({ success: false, message: "Membership expired. Please renew your membership." });
    }

    const activeSession = await Attendance.findOne({
      memberId,
      $or: [
        { checkOutTime: { $exists: false } },
        { checkOutTime: null },
      ],
    });
    if (activeSession) {
      return res.status(400).json({ success: false, message: "Member is already checked in" });
    }

    if (req.userType === "member") {
      const qrValidation = await validateQRToken(qrToken);
      if (!qrValidation.valid) {
        return res.status(400).json({ success: false, message: qrValidation.message });
      }

      const gymConfig = await GymConfig.findOne();
      if (!gymConfig || (gymConfig.latitude === 0 && gymConfig.longitude === 0)) {
        return res.status(400).json({
          success: false,
          message: "Gym location is not configured. Please contact admin.",
        });
      }

      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ success: false, message: "GPS coordinates are required to mark attendance." });
      }

      const distance = getDistance(Number(latitude), Number(longitude), gymConfig.latitude, gymConfig.longitude);
      if (distance > gymConfig.radius) {
        return res.status(400).json({ success: false, message: "You must be inside the gym to mark attendance." });
      }
    }

    const now = new Date();
    const newAttendance = new Attendance({
      memberId,
      date: now,
      checkInTime: now,
      latitude: latitude !== undefined ? Number(latitude) : null,
      longitude: longitude !== undefined ? Number(longitude) : null,
    });
    await newAttendance.save();

    member.lastVisit = now;
    member.attendanceCount = (member.attendanceCount || 0) + 1;
    await member.save();

    return res.status(201).json({
      success: true,
      message: "Checked in successfully",
      data: newAttendance,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error during check-in",
      error: err.message,
    });
  }
};

const checkOut = async (req, res) => {
  try {
    const memberId = req.userType === "member"
      ? req.member._id.toString()
      : req.body.memberId;

    if (!memberId) {
      return res.status(400).json({ success: false, message: "Member ID is required" });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    const activeSession = await Attendance.findOne({
      memberId,
      $or: [
        { checkOutTime: { $exists: false } },
        { checkOutTime: null },
      ],
    });
    if (!activeSession) {
      return res.status(400).json({ success: false, message: "No active check-in session found for this member" });
    }

    const now = new Date();
    activeSession.checkOutTime = now;
    activeSession.duration = calculateWorkoutDuration(activeSession.checkInTime, now);
    await activeSession.save();

    return res.status(200).json({
      success: true,
      message: "Checked out successfully",
      data: activeSession,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error during check-out",
      error: err.message,
    });
  }
};

const todayAttendance = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const attendanceList = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    }).populate("memberId", "fullName phone");

    return res.status(200).json({
      success: true,
      message: "Today's attendance retrieved successfully",
      data: attendanceList,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving today's attendance",
      error: err.message,
    });
  }
};

const memberAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const attendanceList = await Attendance.find({ memberId: id }).sort({ date: -1 });
    return res.status(200).json({
      success: true,
      message: "Member attendance retrieved successfully",
      data: attendanceList,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving member attendance",
      error: err.message,
    });
  }
};

const getActiveQR = async (req, res) => {
  try {
    const dailyQR = await ensureDailyQR();
    return res.status(200).json({
      success: true,
      qrToken: dailyQR.token,
      date: dailyQR.date,
      expiresAt: dailyQR.expiresAt,
    });
  } catch (err) {
    const qrToken = getDailyQRCodeToken();
    return res.status(200).json({
      success: true,
      qrToken,
    });
  }
};

const getGymConfig = async (req, res) => {
  try {
    let config = await GymConfig.findOne();
    if (!config) {
      config = new GymConfig({ latitude: 0.0, longitude: 0.0, radius: 100 });
      await config.save();
    }
    return res.status(200).json({
      success: true,
      data: config,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving gym config",
      error: err.message,
    });
  }
};

const saveGymConfig = async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.body;
    if (latitude === undefined || longitude === undefined || radius === undefined) {
      return res.status(400).json({ success: false, message: "Missing required config parameters" });
    }

    let config = await GymConfig.findOne();
    if (!config) {
      config = new GymConfig();
    }
    config.latitude = Number(latitude);
    config.longitude = Number(longitude);
    config.radius = Number(radius);
    await config.save();

    return res.status(200).json({
      success: true,
      message: "Gym location configuration saved successfully",
      data: config,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error saving gym config",
      error: err.message,
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  todayAttendance,
  memberAttendance,
  getActiveQR,
  getGymConfig,
  saveGymConfig,
};
