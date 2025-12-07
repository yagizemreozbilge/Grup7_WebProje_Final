const validateEmail = (email) => {
  // Must be a valid email format AND end with .edu
  const emailRegex = /^[^\s@]+@[^\s@]+\.edu$/i;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // Minimum 8 characters, at least one uppercase letter, one lowercase letter, and one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validatePhone = (phone) => {
  // Basic phone validation (allows digits, spaces, dashes, parentheses)
  const phoneRegex = /^[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone
};

