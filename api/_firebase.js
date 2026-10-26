import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let initialized = false;

export function getFirebaseAdmin() {
  if (initialized && admin.apps.length > 0) {
    return {
      admin,
      db: admin.firestore(),
      messaging: admin.messaging(),
      auth: admin.auth(),
    };
  }

  try {
    let serviceAccount;

    // 1. Check Environment Variable (for Vercel production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID || 'kudumbam-pay',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
    } else {
      // 2. Read local file in backend-react or workspace
      const localPaths = [
        path.join(process.cwd(), 'service-account.json'),
        path.join(process.cwd(), 'backend-react', 'service-account.json'),
        path.join(process.cwd(), 'backend', 'resources', 'kudumbam-pay-firebase-adminsdk-fbsvc-7f845f2518.json'),
      ];

      for (const p of localPaths) {
        if (fs.existsSync(p)) {
          serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
          break;
        }
      }
    }

    if (!serviceAccount) {
      throw new Error('Firebase service account credentials not found. Set FIREBASE_SERVICE_ACCOUNT in Vercel or place service-account.json.');
    }

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || 'kudumbam-pay',
      });
    }

    initialized = true;
    console.log('🔥 Firebase Admin SDK initialized successfully for project: kudumbam-pay');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }

  return {
    admin,
    db: admin.firestore(),
    messaging: admin.messaging(),
    auth: admin.auth(),
  };
}
