const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const app = require("./app");
const mongoose = require("mongoose");
const { initMembershipExpiryJob } = require("./Jobs/membershipExpiryJob");
const { initPaymentReminderJob } = require("./Jobs/paymentReminderJob");
const { initAIWorkoutJob } = require("./Jobs/aiWorkoutJob");
const { initAutoCheckoutJob } = require("./Jobs/autoCheckoutJob");
const { initDailyQRJob } = require("./Jobs/dailyQRJob");

const PORT = process.env.PORT || 3000;
const DB_URL = process.env.MONGODB_URL;

// Connect to MongoDB
mongoose.connect(DB_URL)
  .then(() => {
    console.log("Connected to MongoDB database");

    // Start Server
    app.listen(PORT, () => {
      console.log(`GymAI Pro server running on port ${PORT}`);

      // Initialize Cron Jobs
      initMembershipExpiryJob();
      initPaymentReminderJob();
      initAIWorkoutJob();
      initAutoCheckoutJob();
      initDailyQRJob();
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
