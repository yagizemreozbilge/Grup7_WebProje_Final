const { User, Student, Faculty, Department } = require('../../models');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { validateEmail, validatePassword } = require('../utils/validation');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./emailService');

const register = async (userData) => {
  const { email, password, role, full_name, student_number, employee_number, department_id, title } = userData;

  // Validate email
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  // Validate password
  if (!validatePassword(password)) {
    throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Generate verification token
  const verification_token = crypto.randomBytes(32).toString('hex');
  const verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user
  const user = await User.create({
    email,
    password_hash,
    role,
    full_name,
    is_verified: false,
    verification_token,
    verification_token_expires
  });

  // Create role-specific record
  if (role === 'student') {
    if (!student_number || !department_id) {
      throw new Error('Student number and department are required for students');
    }
    
    const existingStudent = await Student.findOne({ where: { student_number } });
    if (existingStudent) {
      await user.destroy();
      throw new Error('Student number already exists');
    }

    await Student.create({
      user_id: user.id,
      student_number,
      department_id
    });
  } else if (role === 'faculty') {
    if (!employee_number || !department_id || !title) {
      throw new Error('Employee number, department, and title are required for faculty');
    }

    const existingFaculty = await Faculty.findOne({ where: { employee_number } });
    if (existingFaculty) {
      await user.destroy();
      throw new Error('Employee number already exists');
    }

    await Faculty.create({
      user_id: user.id,
      employee_number,
      department_id,
      title
    });
  }

  // Send verification email
  try {
    await sendVerificationEmail(email, verification_token);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Don't fail registration if email fails
  }

  // Return user without password
  const userResponse = user.toJSON();
  delete userResponse.password_hash;
  delete userResponse.refresh_token;
  delete userResponse.verification_token;
  delete userResponse.reset_password_token;

  return userResponse;
};

const verifyEmail = async (token) => {
  const user = await User.findOne({
    where: {
      verification_token: token,
      is_verified: false
    }
  });

  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  if (user.verification_token_expires < new Date()) {
    throw new Error('Verification token has expired');
  }

  user.is_verified = true;
  user.verification_token = null;
  user.verification_token_expires = null;
  await user.save();

  return user;
};

const login = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({
    where: { email },
    include: [
      { model: Student, as: 'student', include: [{ model: Department, as: 'department' }] },
      { model: Faculty, as: 'faculty', include: [{ model: Department, as: 'department' }] }
    ]
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.is_verified) {
    throw new Error('Please verify your email before logging in');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Generate tokens
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Save refresh token
  user.refresh_token = refreshToken;
  await user.save();

  // Return user without sensitive data
  const userResponse = user.toJSON();
  delete userResponse.password_hash;
  delete userResponse.verification_token;
  delete userResponse.reset_password_token;

  return {
    user: userResponse,
    accessToken,
    refreshToken
  };
};

const refreshToken = async (token) => {
  const { verifyRefreshToken, generateAccessToken } = require('../utils/jwt');
  
  const decoded = verifyRefreshToken(token);

  const user = await User.findOne({ where: { id: decoded.id } });
  if (!user || user.refresh_token !== token) {
    throw new Error('Invalid refresh token');
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  const newAccessToken = generateAccessToken(payload);
  return { accessToken: newAccessToken };
};

const logout = async (userId) => {
  const user = await User.findByPk(userId);
  if (user) {
    user.refresh_token = null;
    await user.save();
  }
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    // Don't reveal if user exists
    return true;
  }

  const reset_token = crypto.randomBytes(32).toString('hex');
  const reset_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  user.reset_password_token = reset_token;
  user.reset_password_expires = reset_token_expires;
  await user.save();

  try {
    await sendPasswordResetEmail(email, reset_token);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }

  return true;
};

const resetPassword = async (token, newPassword) => {
  if (!validatePassword(newPassword)) {
    throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
  }

  const user = await User.findOne({
    where: {
      reset_password_token: token
    }
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  if (user.reset_password_expires < new Date()) {
    throw new Error('Reset token has expired');
  }

  const password_hash = await bcrypt.hash(newPassword, 10);
  user.password_hash = password_hash;
  user.reset_password_token = null;
  user.reset_password_expires = null;
  user.refresh_token = null; // Invalidate all sessions
  await user.save();

  return true;
};

module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword
};

