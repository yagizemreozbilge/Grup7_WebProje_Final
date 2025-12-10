const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    console.log('📨 Register request received:', {
      email: req.body.email,
      role: req.body.role,
      hasFullName: !!req.body.full_name,
      hasStudentNumber: !!req.body.student_number,
      hasEmployeeNumber: !!req.body.employee_number,
      department_id: req.body.department_id
    });

    const user = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: user
    });
  } catch (error) {
    console.error('❌ Register error:', error.message);
    console.error('❌ Error code:', error.code);
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    console.log('📨 Received verify-email request with token:', token ? `${token.substring(0, 20)}...` : 'MISSING');
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Token is required'
        }
      });
    }
    
    await authService.verifyEmail(token);
    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('❌ Verify email error:', error.message);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!token) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Refresh token required' } });
    }

    const result = await authService.refreshToken(token);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.clearCookie('refreshToken');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.status(200).json({ 
      success: true,
      message: 'Password reset link sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;
    await authService.resetPassword(token, password, confirmPassword);
    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword
};

