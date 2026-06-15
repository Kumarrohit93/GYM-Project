const Progress = require("../../Models/ProgressModel");
const Member = require("../../Models/MemberModel");

const addProgress = async (req, res) => {
  try {
    const { memberId, date, weight, bodyFatPercentage, chest, waist, arms, thighs } = req.body;
    if (!memberId || !date || weight === undefined || bodyFatPercentage === undefined) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    const newProgress = new Progress({
      memberId,
      date,
      weight,
      bodyFatPercentage,
      chest: chest || 0,
      waist: waist || 0,
      arms: arms || 0,
      thighs: thighs || 0,
    });
    await newProgress.save();

    // Sync member's weight
    member.weight = weight;
    await member.save();

    return res.status(201).json({
      success: true,
      message: "Progress logged successfully",
      data: newProgress,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error adding progress",
      error: err.message,
    });
  }
};

const getProgress = async (req, res) => {
  try {
    const { memberId } = req.params;
    const progressList = await Progress.find({ memberId }).sort({ date: -1 });
    return res.status(200).json({
      success: true,
      message: "Member progress retrieved successfully",
      data: progressList,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving progress",
      error: err.message,
    });
  }
};

module.exports = {
  addProgress,
  getProgress,
};
