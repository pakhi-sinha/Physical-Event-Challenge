/**
 * VenueCrowd Engine - Server Entry Point
 * Orchestrates security, modular routing, and Google Cloud integrations.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Config & Routes
require('./src/config/firebaseConfig');
const venueRoutes = require('./src/routes/venueRoutes');
const calendarRoutes = require('./src/routes/calendarRoutes');
const googleService = require('./src/services/googleService');

const app = express();
const PORT = process.env.PORT || 3000;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err.name, err.message);
  process.exit(1);
});

// --- Security Middleware ---

/**
 * Global API rate limiter to prevent brute-force attacks.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again later.' }
});

app.use(globalLimiter);


app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "https://maps.googleapis.com"],
      "img-src": ["'self'", "data:", "https://maps.gstatic.com", "https://maps.googleapis.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "connect-src": ["'self'", "https://maps.googleapis.com"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json({ limit: '10kb' })); 
app.use(express.static('public'));

// --- Routing Layer ---
app.use('/api/venue', venueRoutes);
app.use('/api/calendar', calendarRoutes);

// --- Error Handling Layer ---

/**
 * Handle 404 Not Found errors.
 */
app.use((req, res, next) => {
    const AppError = require('./src/utils/AppError');
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404, 'NOT_FOUND'));
});

/**
 * Global Error Handler.
 */
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    // Log structured error for Google Cloud Operations
    googleService.logEvent(err.statusCode >= 500 ? 'ERROR' : 'WARN', err.message, { 
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
      path: req.path,
      method: req.method,
      errorCode: err.errorCode || 'UNEXPECTED_ENGINE_FAILURE'
    });

    res.status(err.statusCode).json({ 
      status: err.status,
      error: {
        code: err.errorCode || 'INTERNAL_ERROR',
        message: err.message,
        trackingId: `VN-ERR-${Date.now()}`
      }
    });
});

// --- Server Lifecycle ---
const server = app.listen(PORT, () => {
    console.log(`\x1b[32m[Success]\x1b[0m Venue Engine Active on port ${PORT}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...', err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;

