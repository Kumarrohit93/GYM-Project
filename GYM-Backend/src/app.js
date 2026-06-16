const express = require("express");
const cors = require("cors");
const path = require("path");

const createAdminRoute = require("./Routes/CreateAdminRoute");
const adminLoginRoute = require("./Routes/AdminLoginRoute");
const memberRoute = require("./Routes/MemberRoute");
const membershipRoute = require("./Routes/MembershipRoute");
const paymentRoute = require("./Routes/PaymentRoute");
const attendanceRoute = require("./Routes/AttendanceRoute");
const exerciseRoute = require("./Routes/ExerciseRoute");
const workoutRoute = require("./Routes/WorkoutRoute");
const progressRoute = require("./Routes/ProgressRoute");
const notificationRoute = require("./Routes/NotificationRoute");
const dashboardRoute = require("./Routes/DashboardRoute");
const healthRoute = require("./Routes/HealthRoute");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/admin", createAdminRoute);
app.use("/admin", adminLoginRoute);
app.use("/member", memberRoute);
app.use("/membership", membershipRoute);
app.use("/payment", paymentRoute);
app.use("/attendance", attendanceRoute);
app.use("/exercise", exerciseRoute);
app.use("/workout", workoutRoute);
app.use("/progress", progressRoute);
app.use("/notification", notificationRoute);
app.use("/dashboard", dashboardRoute);
app.use("/", healthRoute);

// Base route
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Welcome to GymAI Pro API" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

module.exports = app;
