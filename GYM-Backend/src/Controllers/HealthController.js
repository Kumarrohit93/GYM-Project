const mongoose = require("mongoose");

const getPing = (req, res) => {
  res.status(200).json({
    success: true,
    status: "online",
    timestamp: new Date().toISOString(),
  });
};

const getHealth = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const databaseStatus = dbState === 1 ? "connected" : "disconnected";

  res.status(200).json({
    server: "running",
    database: databaseStatus,
    uptime: process.uptime().toFixed(0),
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getPing,
  getHealth,
};
