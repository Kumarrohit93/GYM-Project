const cron = require("node-cron");
const Attendance = require("../../Models/AttendenceModel");
const calculateWorkoutDuration = require("../Utils/calculateWorkoutDuration");

const runAutoCheckout = async () => {
  console.log("[AutoCheckoutJob] Starting automatic checkout at 23:59...");
  try {
    const activeSessions = await Attendance.find({
      $or: [
        { checkOutTime: { $exists: false } },
        { checkOutTime: null },
      ],
    });
    console.log(`[AutoCheckoutJob] Found ${activeSessions.length} active sessions to check out.`);

    let checkedOutCount = 0;
    const now = new Date(); // Runs at 23:59

    for (const session of activeSessions) {
      session.checkOutTime = now;
      session.duration = calculateWorkoutDuration(session.checkInTime, now);
      await session.save();
      checkedOutCount++;
    }

    console.log(`[AutoCheckoutJob] Automatically checked out ${checkedOutCount} members.`);
  } catch (err) {
    console.error("[AutoCheckoutJob] Error in auto checkout job:", err);
  }
};

const initAutoCheckoutJob = () => {
  // Run daily at 23:59
  cron.schedule("59 23 * * *", runAutoCheckout);
  console.log("[AutoCheckoutJob] Auto checkout job scheduled daily at 23:59");
};

module.exports = {
  initAutoCheckoutJob,
  runAutoCheckout,
};
