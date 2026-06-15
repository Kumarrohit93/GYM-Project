const Admin = require("../../Models/AdminModel");
const bcrypt = require("bcryptjs");
const { createAdminSchema } = require("../Validations/adminValidation");

const createAdmin = async (req, res) => {
  try {
    const { error } = createAdminSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { username, password, name } = req.body;
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ username, password: hashedPassword, name });
    await newAdmin.save();

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error creating admin",
      error: err.message,
    });
  }
};

module.exports = { createAdmin };
