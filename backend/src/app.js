require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const sanitizeInput = require('./middleware/inputSanitization');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const departmentsRouter = require('./routes/departments');
const coursesRouter = require('./routes/courses');
const attendanceRouter = require('./routes/attendance');
const studentRouter = require('./routes/student');
const facultyRouter = require('./routes/faculty');
const mealsRouter = require('./routes/meals');
const walletRouter = require('./routes/wallet');
const paymentRouter = require('./routes/payment');
const eventsRouter = require('./routes/events');
const schedulingRouter = require('./routes/scheduling');
const reservationsRouter = require('./routes/reservations');
const analyticsRouter = require('./routes/analytics');
const notificationsRouter = require('./routes/notifications');
const sensorsRouter = require('./routes/sensors');

const app = express();

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Input sanitization (before body parsing)
app.use(sanitizeInput);

// JSON ve urlencoded body parser (en üstte)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS configuration (tek tanım)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://34.77.59.225',
  process.env.FRONTEND_URL
].filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    // Development ortamında tüm localhost portlarına izin ver
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // localhost'un herhangi bir portuna izin ver (development için)
    if (origin && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true
}));

// Security headers (isteğe bağlı)
// app.use(helmet({
//   crossOriginResourcePolicy: false,
//   crossOriginEmbedderPolicy: false
// }));

// Force CORP header globally to fix image loading
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// Rate limiting (enhanced protection)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.'
    });
  }
});

app.use('/api/v1/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true
});

app.use('/api/v1/auth/', authLimiter);

// Routes
app.use('/api/v1', indexRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/departments', departmentsRouter);
app.use('/api/v1/courses', coursesRouter);
app.use('/api/v1/attendance', attendanceRouter);
app.use('/api/v1/student', studentRouter);
app.use('/api/v1/faculty', facultyRouter);
app.use('/api/v1/meals', mealsRouter);
app.use('/api/v1/wallet', walletRouter);
app.use('/payment', paymentRouter);
app.use('/api/v1/events', eventsRouter);
app.use('/api/v1/scheduling', schedulingRouter);
app.use('/api/v1/reservations', reservationsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/sensors', sensorsRouter);

// Error handler (must be last)
app.use(errorHandler);

// Export socket service for use in other modules
app.socketService = require('./services/socketService');

module.exports = app;
