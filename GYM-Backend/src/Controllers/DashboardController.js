const Member = require("../../Models/MemberModel");
const Attendance = require("../../Models/AttendenceModel");
const Payment = require("../../Models/PaymentModel");

const getStats = async (req, res) => {
  try {
    const totalMembers = await Member.countDocuments();
    const activeMembers = await Member.countDocuments({ status: "active" });

    // Today's attendance
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const presentToday = await Attendance.countDocuments({
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    // Monthly revenue (sum of payments with status "paid" in current calendar month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const revenueResult = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          paymentDate: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    const monthlyRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Pending fees (sum of payments with status "pending")
    const pendingResult = await Payment.aggregate([
      {
        $match: {
          status: "pending",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    const pendingFees = pendingResult.length > 0 ? pendingResult[0].total : 0;

    // Inactive members (status is active but lastVisit/joiningDate is 10+ days ago)
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const inactiveMembersList = await Member.find({
      status: "active",
      $or: [
        { lastVisit: { $ne: null, $lte: tenDaysAgo } },
        { lastVisit: null, joiningDate: { $lte: tenDaysAgo } }
      ]
    }).select("fullName phone lastVisit joiningDate");

    return res.status(200).json({
      success: true,
      message: "Dashboard stats retrieved successfully",
      data: {
        totalMembers,
        activeMembers,
        presentToday,
        monthlyRevenue,
        pendingFees,
        inactiveCount: inactiveMembersList.length,
        inactiveMembers: inactiveMembersList,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving dashboard stats",
      error: err.message,
    });
  }
};

module.exports = {
  getStats,
};
