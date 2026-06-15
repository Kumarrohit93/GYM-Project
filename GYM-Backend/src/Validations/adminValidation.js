const Joi = require("joi");

const createAdminSchema = Joi.object({
  username: Joi.string().min(3).required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().optional(),
});

const loginAdminSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

module.exports = {
  createAdminSchema,
  loginAdminSchema,
};
