// Joi validation schemas

const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().pattern(/@.+\.edu(\.tr)?$/i).required()
    .messages({ 'string.pattern.base': 'E-posta adresi .edu veya .edu.tr uzantılı olmalıdır' }),
  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/)
    .required()
    .messages({ 'string.pattern.base': 'Şifre en az 8 karakter uzunluğunda olmalı ve en az bir büyük harf, bir küçük harf ve bir rakam içermelidir' }),
  confirmPassword: Joi.any().equal(Joi.ref('password')).required()
    .messages({ 'any.only': 'Şifreler eşleşmiyor' }),
  role: Joi.string().valid('student', 'faculty', 'admin').required(),
  student_number: Joi.when('role', {
    is: 'student',
    then: Joi.string().min(6).max(20).required(),
    otherwise: Joi.forbidden()
  }),
  department_id: Joi.when('role', {
    is: Joi.string().valid('student', 'faculty'),
    then: Joi.string().required(),
    otherwise: Joi.string().optional()
  }),
  employee_number: Joi.when('role', {
    is: 'faculty',
    then: Joi.string().required(),
    otherwise: Joi.forbidden()
  }),
  title: Joi.when('role', {
    is: 'faculty',
    then: Joi.string().required(),
    otherwise: Joi.forbidden()
  }),
  full_name: Joi.string().optional(),
  phone: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().pattern(/\.edu/i).required()
    .messages({ 'string.pattern.base': 'E-posta adresi .edu uzantılı olmalıdır' }),
  password: Joi.string().required()
    .messages({ 'string.empty': 'Şifre gereklidir' }),
  twoFactorToken: Joi.string().length(6).optional().allow(null, '')
    .messages({ 'string.length': '2FA kodu 6 haneli olmalıdır' })
});

const resetSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/)
    .required()
    .messages({ 'string.pattern.base': 'Şifre en az 8 karakter uzunluğunda olmalı ve en az bir büyük harf, bir küçük harf ve bir rakam içermelidir' }),
  confirmPassword: Joi.any().equal(Joi.ref('password')).required()
    .messages({ 'any.only': 'Şifreler eşleşmiyor' })
});

const updateProfileSchema = Joi.object({
  full_name: Joi.string().optional(),
  phone: Joi.string().pattern(/^[\d\s\-\(\)]+$/).optional()
    .custom((value, helpers) => {
      if (value && value.replace(/\D/g, '').length < 10) {
        return helpers.error('string.pattern.base');
      }
      return value;
    })
    .messages({ 'string.pattern.base': 'Geçersiz telefon numarası formatı' })
});

const validateBody = (schema) => (req, res, next) => {
  // Normalize role to lowercase if present
  if (req.body.role) {
    req.body.role = req.body.role.toLowerCase();
  }
  
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    console.log('❌ Validation Error:', JSON.stringify(error.details, null, 2)); // DEBUG LOG
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.details.map(d => d.message)
      }
    });
  }
  next();
};

const validateRegister = validateBody(registerSchema);
const validateLogin = validateBody(loginSchema);
const validateUpdateProfile = validateBody(updateProfileSchema);
const validateResetPassword = validateBody(resetSchema);

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateResetPassword
};

