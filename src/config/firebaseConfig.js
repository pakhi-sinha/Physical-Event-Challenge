const admin = require('firebase-admin');
const fs = require('fs');

/**
 * Robust Firebase Admin Initialization.
 * Ensures the service account exists before attempting connection.
 */
const initializeFirebase = () => {
  let isInitialized = false;
  
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
    const configPath = process.env.FIREBASE_CONFIG;

    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      let options = {
        credential: admin.credential.cert(serviceAccountPath)
      };

      if (configPath) {
          try {
              options.databaseURL = JSON.parse(configPath).databaseURL;
          } catch (jsonErr) {
              console.warn('[Firebase] Invalid CONFIG JSON format. Skipping databaseURL.');
          }
      }

      admin.initializeApp(options);
      isInitialized = true;
      console.log('[Firebase] Admin SDK initialized successfully.');
    } else {
      console.warn('[Firebase] Service account missing. Operating in local simulation mode.');
    }
  } catch (err) {
    console.error(`[Firebase] Initialization error: ${err.message}`);
  }

  return { admin, isInitialized };
};


module.exports = initializeFirebase();
