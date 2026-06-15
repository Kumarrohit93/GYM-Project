const jwt = require("jsonwebtoken");
const Admin = require("../../Models/AdminModel");
const Member = require("../../Models/MemberModel");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access Denied: No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "member") {
      const member = await Member.findById(decoded.id).select("-password");
      if (!member) {
        return res.status(401).json({
          success: false,
          message: "Access Denied: User not found",
        });
      }
      req.member = member;
      req.userType = "member";
      return next();
    }

    const admin = await Admin.findById(decoded.id).select("-password");
    if (admin) {
      req.admin = admin;
      req.userType = "admin";
      return next();
    }

    const member = await Member.findById(decoded.id).select("-password");
    if (member) {
      req.member = member;
      req.userType = "member";
      return next();
    }

    return res.status(401).json({
      success: false,
      message: "Access Denied: User not found",
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Invalid token",
      error: error.message,
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.userType !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access Denied: Admin privileges required",
    });
  }
  next();
};

const requireMember = (req, res, next) => {
  if (req.userType !== "member") {
    return res.status(403).json({
      success: false,
      message: "Access Denied: Member privileges required",
    });
  }
  next();
};

const assertSelfMemberOrAdmin = (req, res, next) => {
  if (req.userType === "admin") {
    return next();
  }

  const memberId = req.params.id || req.params.memberId || req.body.memberId;
  if (!memberId) {
    return res.status(400).json({
      success: false,
      message: "Member ID is required",
    });
  }

  if (req.member && req.member._id.toString() === String(memberId)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access Denied: You can only access your own data",
  });
};

const resolveAttendanceMember = (req, res, next) => {
  if (req.userType === "member") {
    if (!req.member) {
      return res.status(401).json({
        success: false,
        message: "Access Denied: Member session invalid",
      });
    }
    req.body.memberId = req.member._id.toString();
    return next();
  }

  if (!req.body.memberId) {
    return res.status(400).json({
      success: false,
      message: "Member ID is required",
    });
  }

  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireMember,
  assertSelfMemberOrAdmin,
  resolveAttendanceMember,
};
