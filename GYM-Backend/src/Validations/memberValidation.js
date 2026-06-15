const Joi = require("joi");

const memberSchema = Joi.object({
  fullName: Joi.string().trim().required(),
  phone: Joi.string().required(),
  password: Joi.string().min(6).required(),
  gender: Joi.string().valid("male", "female", "other").default("male"),
  age: Joi.number().integer().min(1).optional(),
  height: Joi.number().positive().optional(),
  weight: Joi.number().positive().optional(),
  goal: Joi.string().valid("muscle_gain", "fat_loss", "strength", "endurance", "general_fitness").default("general_fitness"),
  experienceLevel: Joi.string().valid("beginner", "intermediate", "advanced").default("beginner"),
  injuries: Joi.array().items(Joi.string()).default([]),
  joiningDate: Joi.date().optional(),
  membershipType: Joi.string().valid("monthly", "quarterly", "halfYearly", "yearly").default("monthly"),
  status: Joi.string().valid("active", "inactive", "suspended").default("active"),
  profileImage: Joi.string().allow("").optional()
});

const updateMemberSchema = Joi.object({
  fullName: Joi.string().trim().optional(),
  phone: Joi.string().optional(),
  password: Joi.string().min(6).optional(),
  gender: Joi.string().valid("male", "female", "other").optional(),
  age: Joi.number().integer().min(1).optional(),
  height: Joi.number().positive().optional(),
  weight: Joi.number().positive().optional(),
  goal: Joi.string().valid("muscle_gain", "fat_loss", "strength", "endurance", "general_fitness").optional(),
  experienceLevel: Joi.string().valid("beginner", "intermediate", "advanced").optional(),
  injuries: Joi.array().items(Joi.string()).optional(),
  joiningDate: Joi.date().optional(),
  membershipType: Joi.string().valid("monthly", "quarterly", "halfYearly", "yearly").optional(),
  status: Joi.string().valid("active", "inactive", "suspended").optional(),
  profileImage: Joi.string().allow("").optional()
});

module.exports = {
  memberSchema,
  updateMemberSchema,
};
