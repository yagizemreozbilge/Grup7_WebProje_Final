const prisma = require('../prisma');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./emailService');
const { validatePassword } = require('../utils/validation');

const toRoleEnum = (role) => (role || '').toLowerCase();

const sanitizeUser = (user) => {
  if (!user) return null;
  // Remove sensitive fields and map camelCase to snake_case for frontend compatibility
  const { passwordHash, fullName, isVerified, profilePictureUrl, createdAt, updatedAt, student, faculty, ...rest } = user;
  
  const sanitized = {
    ...rest,
    full_name: fullName,
    is_verified: isVerified,
    profile_picture_url: profilePictureUrl,
    created_at: createdAt,
    updated_at: updatedAt
  };

  if (student) {
    const { studentNumber, departmentId, userId, ...studentRest } = student;
    sanitized.student = {
      ...studentRest,
      student_number: studentNumber,
      department_id: departmentId,
      user_id: userId
    };
  }

  if (faculty) {
    const { employeeNumber, departmentId, userId, ...facultyRest } = faculty;
    sanitized.faculty = {
      ...facultyRest,
      employee_number: employeeNumber,
      department_id: departmentId,
      user_id: userId
    };
  }

  return sanitized;
};

const register = async (userData) => {
  console.log('📝 Register request received:', {
    email: userData.email,
    role: userData.role,
    hasStudentNumber: !!userData.student_number,
    hasEmployeeNumber: !!userData.employee_number,
    department_id: userData.department_id
  });

  // Normalize email to lowercase
  const normalizedEmail = (userData.email || '').toLowerCase().trim();
  
  const {
    password,
    confirmPassword,
    role,
    full_name,
    student_number,
    employee_number,
    department_id,
    title
  } = userData;
  
  const email = normalizedEmail;

  // Validate required fields
  if (!email || !password || !role) {
    const err = new Error('E-posta, şifre ve rol gereklidir');
    err.code = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }

  if (password !== confirmPassword) {
    const err = new Error('Şifreler eşleşmiyor');
    err.code = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }

  // Normalize role to lowercase
  const normalizedRole = (role || '').toLowerCase();

  if (normalizedRole === 'student' && !student_number) {
    const err = new Error('Öğrenci numarası gereklidir');
    err.code = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }

  if (normalizedRole === 'faculty' && (!employee_number || !title)) {
    const err = new Error('Personel numarası ve ünvan gereklidir');
    err.code = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }

  if ((normalizedRole === 'student' || normalizedRole === 'faculty') && !department_id) {
    const err = new Error('Bölüm seçimi gereklidir');
    err.code = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    const err = new Error('Bu e-posta ile kullanıcı zaten var');
    err.code = 'CONFLICT';
    err.statusCode = 409;
    throw err;
  }

  if (normalizedRole === 'student' && student_number) {
    const s = await prisma.student.findUnique({ where: { studentNumber: student_number } });
    if (s) {
      const err = new Error('Öğrenci numarası zaten kullanılıyor');
      err.code = 'CONFLICT';
      err.statusCode = 409;
      throw err;
    }
  }

  if (normalizedRole === 'faculty' && employee_number) {
    const f = await prisma.faculty.findUnique({ where: { employeeNumber: employee_number } });
    if (f) {
      const err = new Error('Personel numarası zaten kullanılıyor');
      err.code = 'CONFLICT';
      err.statusCode = 409;
      throw err;
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Email verification setting (can be disabled via env variable for development)
  const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';
  const isVerified = requireEmailVerification ? false : true; // If verification required, mark as unverified; otherwise verified

  console.log('💾 Creating user in database...');
  console.log('📧 Email verification required:', requireEmailVerification);

  try {
    // Generate verification token if email verification is enabled
    let verificationToken = null;
    let verificationExpires = null;
    
    if (requireEmailVerification) {
      const crypto = require('crypto');
      verificationToken = crypto.randomBytes(32).toString('hex');
      verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }

    const created = await prisma.user.create({
      data: {
        email: normalizedEmail, // Use normalized email
        passwordHash,
        role: toRoleEnum(normalizedRole),
        fullName: full_name || null,
        isVerified: isVerified,
        student: normalizedRole === 'student'
          ? {
              create: {
                studentNumber: student_number,
                departmentId: department_id,
                gpa: 0,
                cgpa: 0
              }
            }
          : undefined,
        faculty: normalizedRole === 'faculty'
          ? {
              create: {
                employeeNumber: employee_number,
                departmentId: department_id,
                title: title
              }
            }
          : undefined,
        // Create email verification token if verification is enabled
        emailVerificationToken: requireEmailVerification ? {
          create: {
            token: verificationToken,
            expiresAt: verificationExpires
          }
        } : undefined
      },
      include: {
        student: true,
        faculty: true,
        emailVerificationToken: true
      }
    });

    console.log('✅ User created successfully:', created.id);

    // Send verification email if required
    if (requireEmailVerification && verificationToken) {
      try {
        await sendVerificationEmail(normalizedEmail, verificationToken);
        console.log('📧 Verification email sent to:', normalizedEmail);
      } catch (emailError) {
        console.error('⚠️ Failed to send verification email:', emailError.message);
        // In development, log the verification token if email sending fails
        if (process.env.NODE_ENV === 'development') {
          const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
          console.log('🔗 Verification URL (for development):', verificationUrl);
          console.log('🔑 Verification Token:', verificationToken);
        }
        // Don't fail registration if email sending fails
      }
    }

    return { userId: created.id, email: created.email, requiresVerification: requireEmailVerification };
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
};

const verifyEmail = async (token) => {
  console.log('🔍 Verifying email with token:', token);
  
  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true }
  });

  console.log('📋 Token record found:', !!record);
  if (record) {
    console.log('⏰ Token expires at:', record.expiresAt);
    console.log('✅ User verified status:', record.user?.isVerified);
    console.log('📧 User email:', record.user?.email);
  }

  if (!record) {
    const err = new Error('Geçersiz doğrulama tokenı');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    throw err;
  }

  if (record.expiresAt < new Date()) {
    const err = new Error('Doğrulama tokenının süresi dolmuş');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    throw err;
  }

  if (record.user.isVerified) {
    const err = new Error('E-posta zaten doğrulanmış');
    err.code = 'BAD_REQUEST';
    err.statusCode = 400;
    throw err;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { isVerified: true }
    }),
    prisma.emailVerificationToken.delete({ where: { id: record.id } })
  ]);

  console.log('✅ Email verified successfully for user:', record.user.email);
};

const login = async (email, password, twoFactorToken = null) => {
  const TwoFactorService = require('./twoFactorService');
  
  // Normalize email to lowercase for case-insensitive lookup
  const normalizedEmail = email.toLowerCase().trim();
  
  console.log('🔐 Login attempt for email:', normalizedEmail);
  
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      student: { include: { department: true } },
      faculty: { include: { department: true } }
    }
  });

  if (!user) {
    console.log('❌ User not found for email:', normalizedEmail);
    const err = new Error('Geçersiz e-posta veya şifre');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    throw err;
  }

  console.log('✅ User found, comparing password...');
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    console.log('❌ Password mismatch for user:', normalizedEmail);
    const err = new Error('Geçersiz e-posta veya şifre');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    throw err;
  }
  
  console.log('✅ Password verified for user:', normalizedEmail);
  
  // Check if email verification is required and user is not verified
  const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';
  if (requireEmailVerification && !user.isVerified) {
    console.log('❌ User email not verified:', normalizedEmail);
    const err = new Error('E-posta adresinizi doğrulamanız gerekiyor. Lütfen e-posta kutunuzu kontrol edin.');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    throw err;
  }
  
  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    if (!twoFactorToken) {
      // Generate temporary token for 2FA verification
      const tempToken = generateAccessToken({ id: user.id, email: user.email, role: user.role }, '5m');
      return {
        requires2FA: true,
        userId: user.id,
        tempToken
      };
    }
    
    // Verify 2FA token
    const secret = await TwoFactorService.getUserSecret(user.id);
    if (!secret) {
      const err = new Error('2FA secret not found');
      err.code = 'UNAUTHORIZED';
      err.statusCode = 401;
      throw err;
    }
    
    const isValid2FA = TwoFactorService.verifyToken({ base32: secret }, twoFactorToken);
    if (!isValid2FA) {
      const err = new Error('Invalid 2FA token');
      err.code = 'UNAUTHORIZED';
      err.statusCode = 401;
      throw err;
    }
  }
  
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken
  };
};

const refreshToken = async (token) => {
  const decoded = verifyRefreshToken(token);
  const stored = await prisma.refreshToken.findUnique({ where: { token } });

  if (!stored || stored.expiresAt < new Date()) {
    const err = new Error('Geçersiz refresh token');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    throw err;
  }

  const payload = { id: decoded.id, email: decoded.email, role: decoded.role };
  return { accessToken: generateAccessToken(payload) };
};

const logout = async (userId) => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt
    }
  });

  await sendPasswordResetEmail(email, token);
};

const resetPassword = async (token, password, confirmPassword) => {
  if (password !== confirmPassword) {
    const err = new Error('Şifreler eşleşmiyor');
    err.code = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }

  if (!validatePassword(password)) {
    const err = new Error('Şifre kriterlerini sağlamıyor');
    err.code = 'VALIDATION_ERROR';
    err.statusCode = 400;
    throw err;
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!record || record.expiresAt < new Date()) {
    const err = new Error('Geçersiz veya süresi dolmuş sıfırlama tokenı');
    err.code = 'UNAUTHORIZED';
    err.statusCode = 401;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: hashed }
    }),
    prisma.passwordResetToken.delete({ where: { id: record.id } }),
    prisma.refreshToken.deleteMany({ where: { userId: record.userId } })
  ]);
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