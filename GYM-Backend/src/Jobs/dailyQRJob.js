const cron = require("node-cron");
const { ensureDailyQR } = require("../Utils/qrTokenUtils");

const runDailyQRGeneration = async () => {
  console.log("[DailyQRJob] Generating new daily QR code...");
  try {
    const dailyQR = await ensureDailyQR();
    console.log(`[DailyQRJob] Active QR token generated for ${dailyQR.date}`);
  } catch (err) {
    console.error("[DailyQRJob] Error generating daily QR:", err);
  }
};

const initDailyQRJob = () => {
  cron.schedule("0 0 * * *", runDailyQRGeneration);
  cron.schedule("0 3 * * *", runDailyQRGeneration);
  runDailyQRGeneration();
  console.log("[DailyQRJob] Daily QR job scheduled at midnight and 3:00 AM");
};

module.exports = {
  initDailyQRJob,
  runDailyQRGeneration,
};
