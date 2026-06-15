const Payment = require("../../Models/PaymentModel");
const Member = require("../../Models/MemberModel");
const { paymentSchema } = require("../Validations/paymentValidation");

const createPayment = async (req, res) => {
  try {
    const { error } = paymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { memberId, amount, dueDate, status, paymentMethod } = req.body;
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    const newPayment = new Payment({
      memberId,
      amount,
      dueDate,
      status,
      paymentMethod,
      paymentDate: status === "paid" ? new Date() : null,
    });
    await newPayment.save();

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: newPayment,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error creating payment",
      error: err.message,
    });
  }
};

const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate("memberId", "fullName phone");
    return res.status(200).json({
      success: true,
      message: "Payments retrieved successfully",
      data: payments,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving payments",
      error: err.message,
    });
  }
};

const getMemberPayments = async (req, res) => {
  try {
    const { memberId } = req.params;
    const payments = await Payment.find({ memberId }).populate("memberId", "fullName phone");

    // Calculate pending dues: sum of all payments with status !== "paid"
    const pendingPayments = await Payment.find({ memberId, status: { $ne: "paid" } });
    const pendingDues = pendingPayments.reduce((total, p) => total + p.amount, 0);

    return res.status(200).json({
      success: true,
      message: "Member payments retrieved successfully",
      data: {
        payments,
        pendingDues,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving member payments",
      error: err.message,
    });
  }
};

module.exports = {
  createPayment,
  getPayments,
  getMemberPayments,
};
