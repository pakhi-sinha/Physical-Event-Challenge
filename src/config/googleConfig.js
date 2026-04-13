const { google } = require('googleapis');

/**
 * Configuration for Google APIs (Calendar, Auth, etc.).
 */
const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/calendar.events']
});

const calendar = google.calendar({ version: 'v3', auth });

module.exports = {
  calendar
};
