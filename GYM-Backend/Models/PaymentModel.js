const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "paid", "overdue"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "UPI", "card",],
    default: "cash",
  },
});
const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
