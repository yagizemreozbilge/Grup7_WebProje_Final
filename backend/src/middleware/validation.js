const { validateEmail, validatePassword, validatePhone } = require('../utils/validation');

const validateRegister = (req, res, next) => {
  const { email, password, role, student_number, employee_number, department_id, title } = req.body;

  // Email validation
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi gereklidir (.edu uzantılı)' });
  }

  // Password validation
  if (!password || !validatePassword(password)) {
    return res.status(400).json({ 
      error: 'Şifre en az 8 karakter uzunluğunda olmalı ve en az bir büyük harf, bir küçük harf ve bir rakam içermelidir' 
    });
  }

  // Role validation
  if (!role || !['student', 'faculty', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Geçerli bir rol gereklidir (öğrenci, akademisyen veya yönetici)' });
  }

  // Student-specific validation
  if (role === 'student') {
    if (!student_number) {
      return res.status(400).json({ error: 'Öğrenciler için öğrenci numarası gereklidir' });
    }
    if (!department_id) {
      return res.status(400).json({ error: 'Öğrenciler için bölüm gereklidir' });
    }
  }

  // Faculty-specific validation
  if (role === 'faculty') {
    if (!employee_number) {
      return res.status(400).json({ error: 'Akademisyenler için personel numarası gereklidir' });
    }
    if (!department_id) {
      return res.status(400).json({ error: 'Akademisyenler için bölüm gereklidir' });
    }
    if (!title) {
      return res.status(400).json({ error: 'Akademisyenler için ünvan gereklidir' });
    }
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi gereklidir (.edu uzantılı)' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Şifre gereklidir' });
  }

  next();
};

const validateUpdateProfile = (req, res, next) => {
  const { phone } = req.body;

  if (phone && !validatePhone(phone)) {
    return res.status(400).json({ error: 'Geçersiz telefon numarası formatı' });
  }

  next();
};

const validateResetPassword = (req, res, next) => {
  const { password } = req.body;

  if (!password || !validatePassword(password)) {
    return res.status(400).json({ 
      error: 'Şifre en az 8 karakter uzunluğunda olmalı ve en az bir büyük harf, bir küçük harf ve bir rakam içermelidir' 
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateResetPassword
};

