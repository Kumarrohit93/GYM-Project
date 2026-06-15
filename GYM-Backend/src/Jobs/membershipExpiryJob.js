const cron = require("node-cron");
const Membership = require("../../Models/MembershiModel");
const Member = require("../../Models/MemberModel");
const Notification = require("../../Models/NotificationsModel");

const runExpiryCheck = async () => {
  console.log("[ExpiryJob] Running membership expiry check...");
  try {
    const now = new Date();

    // Mark memberships that have passed their endDate as inactive
    const expiredMemberships = await Membership.updateMany(
      { endDate: { $lt: now }, isActive: true },
      { isActive: false }
    );
    console.log(`[ExpiryJob] Deactivated ${expiredMemberships.modifiedCount} memberships`);

    // Set member profile statuses to inactive if their expiration date has passed
    const expiredMembers = await Member.updateMany(
      { membershipExpiry: { $lt: now }, status: "active" },
      { status: "inactive" }
    );
    console.log(`[ExpiryJob] Set status to 'inactive' for ${expiredMembers.modifiedCount} members`);
  } catch (err) {
    console.error("[ExpiryJob] Error in membership expiry check:", err);
  }
};

const sendExpiryReminders = async () => {
  console.log("[ExpiryJob] Running membership expiry reminders check...");
  try {
    const today = new Date();
    
    // 2 days from now range
    const target2DaysStart = new Date(today);
    target2DaysStart.setDate(today.getDate() + 2);
    target2DaysStart.setHours(0, 0, 0, 0);
    const target2DaysEnd = new Date(today);
    target2DaysEnd.setDate(today.getDate() + 2);
    target2DaysEnd.setHours(23, 59, 59, 999);

    // 1 day from now range
    const target1DayStart = new Date(today);
    target1DayStart.setDate(today.getDate() + 1);
    target1DayStart.setHours(0, 0, 0, 0);
    const target1DayEnd = new Date(today);
    target1DayEnd.setDate(today.getDate() + 1);
    target1DayEnd.setHours(23, 59, 59, 999);

    const membersDue = await Member.find({
      status: "active",
      $or: [
        { membershipExpiry: { $gte: target2DaysStart, $lte: target2DaysEnd } },
        { membershipExpiry: { $gte: target1DayStart, $lte: target1DayEnd } }
      ]
    });

    console.log(`[ExpiryJob] Found ${membersDue.length} members due for reminders`);

    for (const member of membersDue) {
      const day = member.membershipExpiry.getDate();
      const month = member.membershipExpiry.toLocaleDateString("en-US", { month: "long" });
      const expiryFormatted = `${day} ${month}`;

      const title = "Membership Expiry Reminder";
      const message = `Your gym membership expires on ${expiryFormatted}. Please renew your membership.`;

      const existing = await Notification.findOne({
        memberId: member._id,
        title,
        message
      });

      if (!existing) {
        const newNotif = new Notification({
          memberId: member._id,
          title,
          message,
          read: false
        });
        await newNotif.save();
        console.log(`[ExpiryJob] Sent expiration reminder to ${member.fullName}`);
      }
    }
  } catch (err) {
    console.error("[ExpiryJob] Error running expiry reminders:", err);
  }
};

const initMembershipExpiryJob = () => {
  // Run daily at midnight
  cron.schedule("0 0 * * *", runExpiryCheck);
  // Run daily at 6:00 AM for reminders
  cron.schedule("0 6 * * *", sendExpiryReminders);
  console.log("[ExpiryJob] Membership expiry jobs scheduled successfully");
};

module.exports = {
  initMembershipExpiryJob,
  runExpiryCheck,
  sendExpiryReminders,
};
