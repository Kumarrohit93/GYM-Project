const crypto = require("crypto");
const DailyQR = require("../../Models/DailyQRModel");

const getDateString = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const generateTokenForDate = (dateStr) => {
  const secret = process.env.JWT_SECRET || "fallback_secret";
  return crypto.createHmac("sha256", secret).update(dateStr).digest("hex");
};

const getEndOfDay = (date = new Date()) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

const getDailyQRCodeToken = () => {
  const dateStr = getDateString();
  return generateTokenForDate(dateStr);
};

const ensureDailyQR = async () => {
  const dateStr = getDateString();
  let dailyQR = await DailyQR.findOne({ date: dateStr });

  if (!dailyQR) {
    const token = generateTokenForDate(dateStr);
    await DailyQR.updateMany({ isActive: true }, { isActive: false });
    dailyQR = new DailyQR({
      date: dateStr,
      token,
      isActive: true,
      expiresAt: getEndOfDay(),
    });
    await dailyQR.save();
  }

  return dailyQR;
};

const validateQRToken = async (qrToken) => {
  const dateStr = getDateString();
  const dailyQR = await DailyQR.findOne({ date: dateStr, isActive: true });

  if (dailyQR) {
    if (dailyQR.token !== qrToken) {
      return { valid: false, message: "Invalid or expired QR code. Please scan the current active QR code." };
    }
    if (new Date() > dailyQR.expiresAt) {
      return { valid: false, message: "Invalid or expired QR code. Please scan the current active QR code." };
    }
    return { valid: true };
  }

  const expectedToken = getDailyQRCodeToken();
  if (!qrToken || qrToken !== expectedToken) {
    return { valid: false, message: "Invalid or expired QR code. Please scan the current active QR code." };
  }
  return { valid: true };
};

module.exports = {
  getDateString,
  generateTokenForDate,
  getDailyQRCodeToken,
  ensureDailyQR,
  validateQRToken,
  getEndOfDay,
};
