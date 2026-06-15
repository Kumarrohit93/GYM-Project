const Joi = require("joi");

const membershipSchema = Joi.object({
  memberId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid Member ID format (must be a 24-character hex string)",
  }),
  planId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid Plan ID format (must be a 24-character hex string)",
  }),
  startDate: Joi.date().required(),
});

const renewMembershipSchema = Joi.object({
  planId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid Plan ID format (must be a 24-character hex string)",
  }),
  startDate: Joi.date().required(),
});

module.exports = {
  membershipSchema,
  renewMembershipSchema,
};
