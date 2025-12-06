const { validateEmail, validatePassword, validatePhone } = require('../utils/validation');

const validateRegister = (req, res, next) => {
  const { email, password, role, student_number, employee_number, department_id, title } = req.body;

  // Email validation
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  // Password validation
  if (!password || !validatePassword(password)) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number' 
    });
  }

  // Role validation
  if (!role || !['student', 'faculty', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Valid role is required (student, faculty, or admin)' });
  }

  // Student-specific validation
  if (role === 'student') {
    if (!student_number) {
      return res.status(400).json({ error: 'Student number is required for students' });
    }
    if (!department_id) {
      return res.status(400).json({ error: 'Department is required for students' });
    }
  }

  // Faculty-specific validation
  if (role === 'faculty') {
    if (!employee_number) {
      return res.status(400).json({ error: 'Employee number is required for faculty' });
    }
    if (!department_id) {
      return res.status(400).json({ error: 'Department is required for faculty' });
    }
    if (!title) {
      return res.status(400).json({ error: 'Title is required for faculty' });
    }
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  next();
};

const validateUpdateProfile = (req, res, next) => {
  const { phone } = req.body;

  if (phone && !validatePhone(phone)) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  next();
};

const validateResetPassword = (req, res, next) => {
  const { password } = req.body;

  if (!password || !validatePassword(password)) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number' 
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

