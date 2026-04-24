const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function normalizePrivateKey(privateKey) {
  return privateKey ? privateKey.replace(/\\n/g, '\n') : privateKey;
}

function getServiceAccountFromEnv() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    return {
      projectId: parsed.projectId || parsed.project_id,
      clientEmail: parsed.clientEmail || parsed.client_email,
      privateKey: normalizePrivateKey(parsed.privateKey || parsed.private_key),
    };
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    };
  }

  return null;
}

try {
  if (!admin.apps.length) {
    const serviceAccount = getServiceAccountFromEnv();
    const options = {};

    if (serviceAccount) {
      options.credential = admin.credential.cert(serviceAccount);
      options.projectId = serviceAccount.projectId || serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID;
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      options.credential = admin.credential.applicationDefault();
      if (process.env.FIREBASE_PROJECT_ID) {
        options.projectId = process.env.FIREBASE_PROJECT_ID;
      }
    } else if (process.env.FIREBASE_PROJECT_ID) {
      options.projectId = process.env.FIREBASE_PROJECT_ID;
    }

    admin.initializeApp(options);
    console.log(`Firebase Admin initialized successfully for project: ${options.projectId || 'default'}`);
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

module.exports = admin;
