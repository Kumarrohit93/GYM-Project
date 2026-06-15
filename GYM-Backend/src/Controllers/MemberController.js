const Member = require("../../Models/MemberModel");
const Attendance = require("../../Models/AttendenceModel");
const Payment = require("../../Models/PaymentModel");
const Workout = require("../../Models/WorkoutModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { memberSchema, updateMemberSchema } = require("../Validations/memberValidation");

const createMember = async (req, res) => {
  try {
    const { error } = memberSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { phone, password } = req.body;
    const existing = await Member.findOne({ phone });
    if (existing) {
      return res.status(400).json({ success: false, message: "Member with this phone number already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newMember = new Member({
      ...req.body,
      password: hashedPassword,
    });
    await newMember.save();

    const memberObj = newMember.toObject();
    delete memberObj.password;

    return res.status(201).json({
      success: true,
      message: "Member created successfully",
      data: memberObj,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error creating member",
      error: err.message,
    });
  }
};

const getAllMembers = async (req, res) => {
  try {
    const members = await Member.find().select("-password");
    return res.status(200).json({
      success: true,
      message: "Members retrieved successfully",
      data: members,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving members",
      error: err.message,
    });
  }
};

const getSingleMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).select("-password");
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Member retrieved successfully",
      data: member,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving member",
      error: err.message,
    });
  }
};

const updateMember = async (req, res) => {
  try {
    const { error } = updateMemberSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const updateData = { ...req.body };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const member = await Member.findByIdAndUpdate(req.params.id, updateData, { new: true }).select("-password");
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Member updated successfully",
      data: member,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error updating member",
      error: err.message,
    });
  }
};

const deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Member deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error deleting member",
      error: err.message,
    });
  }
};

const memberLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: "Phone and password are required" });
    }

    const member = await Member.findOne({ phone });
    if (!member) {
      return res.status(401).json({ success: false, message: "Invalid phone or password" });
    }

    if (member.status === "suspended") {
      return res.status(403).json({ success: false, message: "Your account is suspended. Please contact admin." });
    }

    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid phone or password" });
    }

    const token = jwt.sign({ id: member._id, role: "member" }, process.env.JWT_SECRET, { expiresIn: "1d" });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      member: {
        id: member._id.toString(),
        fullName: member.fullName,
        phone: member.phone,
        status: member.status,
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

const getMemberAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await Member.findById(id).select("-password");
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    // Attendance Calculations
    const attendances = await Attendance.find({ memberId: id });
    const totalAttendance = attendances.length;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const currentMonthAttendance = attendances.filter(a => new Date(a.date) >= startOfMonth).length;

    // Time calculations (duration is in minutes)
    const sessionsWithDuration = attendances.filter(a => a.duration !== undefined && a.duration !== null);
    const totalTimeSpent = sessionsWithDuration.reduce((acc, curr) => acc + curr.duration, 0);
    const averageGymTime = sessionsWithDuration.length > 0 ? Math.round(totalTimeSpent / sessionsWithDuration.length) : 0;

    const monthlySessions = sessionsWithDuration.filter(a => new Date(a.date) >= startOfMonth);
    const monthlyTimeSpent = monthlySessions.reduce((acc, curr) => acc + curr.duration, 0);

    // Payment Calculations
    const payments = await Payment.find({ memberId: id }).sort({ dueDate: -1 });
    const paidMonths = payments.filter(p => p.status === "paid").length;
    const pendingPayments = payments.filter(p => p.status === "pending").length;
    const overduePayments = payments.filter(p => p.status === "overdue").length;

    // Workout Calculations
    const workouts = await Workout.find({ memberId: id });
    const totalWorkouts = workouts.length;
    const completedWorkouts = workouts.filter(w => w.status === "completed");
    const totalWorkoutsCompleted = completedWorkouts.length;
    const completionPercentage = totalWorkouts > 0 ? Math.round((totalWorkoutsCompleted / totalWorkouts) * 100) : 0;

    const lastWorkout = workouts.length > 0 ? workouts.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
    const lastWorkoutDate = lastWorkout ? lastWorkout.date : null;

    return res.status(200).json({
      success: true,
      message: "Member analytics retrieved successfully",
      data: {
        member,
        attendance: {
          totalAttendance,
          currentMonthAttendance,
          lastVisit: member.lastVisit,
          averageGymTime, // in minutes
          totalTimeSpent, // in minutes
          monthlyTimeSpent, // in minutes
        },
        payment: {
          history: payments,
          paidMonths,
          pendingPayments,
          overduePayments,
        },
        workout: {
          totalWorkoutsCompleted,
          completionPercentage,
          lastWorkoutDate,
        }
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving member analytics",
      error: err.message,
    });
  }
};

module.exports = {
  createMember,
  getAllMembers,
  getSingleMember,
  updateMember,
  deleteMember,
  memberLogin,
  getMemberAnalytics,
};
