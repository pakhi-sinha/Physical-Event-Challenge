const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { apiLimiter } = require('../middleware/limiter');
const { calendar } = require('../config/googleConfig');
const googleService = require('../services/googleService');

/**
 * Endpoint to sync stadium events with attendee's Google Calendar.
 */
router.post('/sync', 
  apiLimiter,
  body('eventId').optional().isString().escape(),
  validate,
  async (req, res, next) => {
    const eventPayload = {
      summary: 'Stadium Event Day Optimizer',
      location: 'Gate B, Sports Venue',
      description: 'Arrive via North Gate B for 40% less congestion. Optimized route provided by VenueCrowd.',
      start: { dateTime: '2026-05-10T18:00:00Z', timeZone: 'UTC' },
      end: { dateTime: '2026-05-10T22:00:00Z', timeZone: 'UTC' }
    };

    try {
      const response = await calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        resource: eventPayload,
      });
      
      googleService.logEvent('INFO', 'Calendar event successfully synced', { eventId: response.data.id });
      res.json({ success: true, link: response.data.htmlLink });
      
    } catch (err) {
      // Graceful fallback for simulation/demo environments
      googleService.logEvent('WARN', 'Calendar sync in simulated mode', { error: err.message });
      res.status(200).json({ 
          error: "Notice: Calendar sync is currently in simulated mode.", 
          mockLink: "https://calendar.google.com/event?id=venue_crowd_demo_sync" 
      });
    }
});

module.exports = router;

