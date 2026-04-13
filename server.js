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

/**
 * Content Security Policy to protect against XSS and injection.
 */
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

/**
 * CORS Configuration for trusted API interaction.
 */
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

// --- Application Middleware ---

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
    const err = new Error('Resource not found');
    err.status = 404;
    next(err);
});

/**
 * Standardized Global Error Handler.
 * Logs structured errors to stdout for Google Cloud Operations.
 */
app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    const isOperational = statusCode < 500;
    
    googleService.logEvent(isOperational ? 'WARN' : 'ERROR', err.message, { 
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
      path: req.path,
      method: req.method,
      statusCode
    });

    res.status(statusCode).json({ 
      error: err.name || 'VenueEngineException',
      message: err.message || 'An unexpected error occurred in the Venue Engine.',
      trackingId: `STAD-${Date.now()}` 
    });
});


// --- Server Lifecycle ---

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\x1b[32m[Success]\x1b[0m Venue Engine Active on http://localhost:${PORT}`);
  });
}

module.exports = app;
