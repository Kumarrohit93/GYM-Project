const cron = require("node-cron");
const Payment = require("../../Models/PaymentModel");
const Notification = require("../../Models/NotificationsModel");

const runPaymentReminders = async () => {
  console.log("[PaymentReminderJob] Running payment reminder job...");
  try {
    const now = new Date();

    // Mark pending payments that have passed their due date as overdue
    const overdueResult = await Payment.updateMany(
      { dueDate: { $lt: now }, status: "pending" },
      { status: "overdue" }
    );
    console.log(`[PaymentReminderJob] Marked ${overdueResult.modifiedCount} payments as overdue`);

    // Find payments due soon (within 3 days) or already overdue
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const paymentsDue = await Payment.find({
      status: { $in: ["pending", "overdue"] },
      dueDate: { $lte: threeDaysFromNow },
    });

    for (const payment of paymentsDue) {
      let title = "Upcoming Payment Due Reminder";
      let message = `Your payment of $${payment.amount} is due on ${payment.dueDate.toDateString()}. Please pay to avoid membership suspension.`;

      if (payment.status === "overdue") {
        title = "ALERT: Overdue Payment";
        message = `Your payment of $${payment.amount} was due on ${payment.dueDate.toDateString()} and is now overdue. Please pay immediately.`;
      }

      // Avoid creating duplicate notification logs
      const existingNotification = await Notification.findOne({
        memberId: payment.memberId,
        title: title,
        message: message,
      });

      if (!existingNotification) {
        const newNotification = new Notification({
          memberId: payment.memberId,
          title,
          message,
          read: false,
        });
        await newNotification.save();
      }
    }
    console.log(`[PaymentReminderJob] Processed reminders for ${paymentsDue.length} due/overdue payments`);
  } catch (err) {
    console.error("[PaymentReminderJob] Error in payment reminder job:", err);
  }
};

const initPaymentReminderJob = () => {
  // Run daily at 1 AM
  cron.schedule("0 1 * * *", runPaymentReminders);
  console.log("[PaymentReminderJob] Payment reminder job scheduled daily at 1:00 AM");
};

module.exports = {
  initPaymentReminderJob,
  runPaymentReminders,
};
