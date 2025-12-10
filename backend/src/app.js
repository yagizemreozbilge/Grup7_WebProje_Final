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

const app = express();

// Security headers
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

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, path, stat) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Routes
app.use('/api/v1', indexRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/departments', departmentsRouter);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
