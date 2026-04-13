const express = require('express');
const router = express.Router();
const { query, body } = require('express-validator');
const validate = require('../middleware/validate');
const { apiLimiter, strictLimiter } = require('../middleware/limiter');
const AppError = require('../utils/AppError');

// Services & Data
const navService = require('../services/navigationService');
const queueService = require('../services/queueService');
const googleService = require('../services/googleService');
const { zones } = require('../data/venueData');
const { DENSITY_LEVELS, STATUS } = require('../utils/constants');

/**
 * Helper to determine density status string.
 */
const getDensityStatus = (density) => {
  if (density > DENSITY_LEVELS.HIGH) return STATUS.HIGH;
  if (density > DENSITY_LEVELS.MEDIUM) return STATUS.MEDIUM;
  return STATUS.LOW;
};

/**
 * GET /api/venue/crowd
 */
router.get('/crowd', apiLimiter, (req, res, next) => {
  try {
    const report = zones.map(z => ({
      id: z.id,
      name: z.name,
      density: z.density,
      status: getDensityStatus(z.density)
    }));
    res.json(report);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/venue/queue
 */
router.get('/queue', apiLimiter, (req, res, next) => {
  try {
    const report = queueService.getPredictionReport();
    res.json(report);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/venue/route
 */
router.get('/route', 
  apiLimiter,
  query('from').isString().trim().notEmpty().escape(),
  query('to').isString().trim().notEmpty().escape(),
  validate,
  (req, res, next) => {
    try {
      const { from, to } = req.query;
      const result = navService.findSmartPath(from, to);
      
      if (!result) {
         throw new AppError('No viable path found between these locations.', 404, 'PATH_NOT_FOUND');
      }
      
      res.json(result);
    } catch (err) {
      next(err);
    }
});

/**
 * GET /api/venue/assistant
 */
router.get('/assistant',
  apiLimiter,
  query('q').isString().trim().notEmpty().escape(),
  validate,
  async (req, res, next) => {
    try {
        const result = await googleService.analyzeVenueNeeds(req.query.q);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/venue/alert
 */
router.get('/alert', apiLimiter, (req, res) => {
    const alertData = {
        title: "⚠️ Venue Congestion Update",
        message: "Notice: Food Court is currently at max capacity (95%). Consider East Concourse for faster seating access.",
        affectedZones: ["food_court"],
        timestamp: new Date().toISOString()
    };
    res.json({ status: "Alert Sent", source: "Simulation Engine", alert: alertData });
});

/**
 * POST /api/venue/admin/density
 */
router.post('/admin/density',
  strictLimiter,
  body('zoneId').isString().notEmpty().escape(),
  body('density').isNumeric().isInt({ min: 0, max: 100 }),
  validate,
  (req, res, next) => {
    try {
      const { zoneId, density } = req.body;
      const zone = zones.find(z => z.id === zoneId);
      
      if (!zone) {
        throw new AppError('Target zone not found in venue database.', 404, 'ZONE_NOT_FOUND');
      }
      
      zone.density = density;
      res.json({ success: true, updatedZone: { id: zone.id, density: zone.density } });
    } catch (err) {
      next(err);
    }
});


module.exports = router;

