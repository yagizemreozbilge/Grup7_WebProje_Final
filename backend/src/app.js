require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const departmentsRouter = require('./routes/departments');
const coursesRouter = require('./routes/courses');
const attendanceRouter = require('./routes/attendance');
const studentRouter = require('./routes/student');
const facultyRouter = require('./routes/faculty');

const app = express();

// JSON ve urlencoded body parser (en üstte)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS configuration (tek tanım)
const allowedOrigins = [
  'http://localhost:3000',
  'http://34.77.59.225',
  process.env.FRONTEND_URL
].filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS: ' + origin));
    }
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

// Rate limiting (basic protection)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// Routes
app.use('/api/v1', indexRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/departments', departmentsRouter);
app.use('/api/v1/courses', coursesRouter);
app.use('/api/v1/attendance', attendanceRouter);
app.use('/api/v1/student', studentRouter);
app.use('/api/v1/faculty', facultyRouter);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
