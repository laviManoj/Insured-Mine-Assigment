const Joi = require('joi');

const agentSchema = Joi.object({
  agentName: Joi.string().trim().max(100).required(),
  agentId: Joi.string().trim().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().trim().optional(),
  department: Joi.string().trim().optional(),
  isActive: Joi.boolean().optional()
});

const userSchema = Joi.object({
  firstName: Joi.string().trim().max(50).required(),
  lastName: Joi.string().trim().max(50).optional(),
  dateOfBirth: Joi.date().required(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    country: Joi.string().optional()
  }).optional(),
  phoneNumber: Joi.string().trim().required(),
  state: Joi.string().trim().required(),
  zipCode: Joi.string().trim().required(),
  email: Joi.string().email().required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  userType: Joi.string().valid('Individual', 'Business', 'Family', 'Corporate').required(),
  isActive: Joi.boolean().optional()
});

const policySchema = Joi.object({
  policyNumber: Joi.string().trim().required(),
  policyStartDate: Joi.date().required(),
  policyEndDate: Joi.date().greater(Joi.ref('policyStartDate')).required(),
  userId: Joi.string().hex().length(24).required(),
  categoryId: Joi.string().hex().length(24).required(),
  carrierId: Joi.string().hex().length(24).required(),
  agentId: Joi.string().hex().length(24).optional(),
  collectionId: Joi.string().trim().optional(),
  companyCollectionId: Joi.string().trim().optional(),
  premiumAmount: Joi.number().min(0).optional(),
  coverageAmount: Joi.number().min(0).optional(),
  status: Joi.string().valid('Active', 'Expired', 'Cancelled', 'Pending').optional(),
  paymentFrequency: Joi.string().valid('Monthly', 'Quarterly', 'Semi-Annual', 'Annual').optional(),
  isActive: Joi.boolean().optional()
});

const validateAgent = (req, res, next) => {
  const { error } = agentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      details: error.details[0].message
    });
  }
  next();
};

const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      details: error.details[0].message
    });
  }
  next();
};

const validatePolicy = (req, res, next) => {
  const { error } = policySchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      details: error.details[0].message
    });
  }
  next();
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        details: error.details[0].message
      });
    }
    next();
  };
};

module.exports = {
  validateAgent,
  validateUser,
  validatePolicy,
  validate,
  agentSchema,
  userSchema,
  policySchema
};
