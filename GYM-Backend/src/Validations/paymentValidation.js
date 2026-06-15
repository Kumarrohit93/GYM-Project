const Joi = require("joi");

const paymentSchema = Joi.object({
  memberId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid Member ID format (must be a 24-character hex string)",
  }),
  amount: Joi.number().positive().required(),
  dueDate: Joi.date().required(),
  status: Joi.string().valid("pending", "paid", "overdue").default("pending"),
  paymentMethod: Joi.string().valid("cash", "UPI", "card").default("cash")
});

module.exports = {
  paymentSchema,
};
