const Admin = require("../../Models/AdminModel");
const bcrypt = require("bcryptjs");
const generateToken = require("../Utils/generateToken");
const { loginAdminSchema } = require("../Validations/adminValidation");

const adminLogin = async (req, res) => {
  try {
    const { error } = loginAdminSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const token = generateToken(admin);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    // req.admin is populated by verifyToken middleware
    return res.status(200).json({
      success: true,
      message: "Admin profile retrieved successfully",
      data: req.admin,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

module.exports = {
  adminLogin,
  getAdminProfile,
};
