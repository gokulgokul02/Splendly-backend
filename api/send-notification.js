// Vercel Serverless Function — FCM v1 Push Notification Proxy (Califnco Pattern)
// POST /api/send-notification
// Body: { token, title, body, data }

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin once (Vercel keeps functions warm)
if (!getApps().length) {
  let serviceAccount = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON env var:', e);
    }
  }

  if (!serviceAccount) {
    const candidatePaths = [
      path.join(process.cwd(), 'service-account.json'),
      path.join(process.cwd(), 'backend-react', 'service-account.json'),
      path.join(process.cwd(), 'backend', 'resources', 'kudumbam-pay-firebase-adminsdk-fbsvc-7f845f2518.json'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
          break;
        } catch (_) {}
      }
    }
  }

  if (serviceAccount) {
    initializeApp({ credential: cert(serviceAccount) });
    console.log('🔥 [Califnco Admin FCM] Firebase Admin Initialized with Service Account');
  } else {
    console.warn('⚠️ No service account credentials found for Firebase Admin');
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, title, body, data = {} } = req.body || {};

  if (!token || !title) {
    return res.status(400).json({ error: 'token and title are required' });
  }

  try {
    const messaging = getMessaging();

    const voiceText = data.voiceText || body || '';
    const formattedData = Object.fromEntries(
      Object.entries({
        ...data,
        title: String(title),
        body: String(body || ''),
        voiceText: String(voiceText),
        timestamp: new Date().toISOString(),
      }).map(([k, v]) => [k, String(v)])
    );

    const response = await messaging.send({
      token,
      notification: { title, body: body || '' },
      data: formattedData,
      android: {
        priority: 'high',
        notification: {
          channelId: 'splendly_alerts_v2',
          sound: 'coinsound',
          priority: 'max',
          visibility: 'public',
        },
      },
    });

    console.log(`✅ [Califnco FCM] Notification sent successfully. ID: ${response}`);
    return res.status(200).json({ success: true, messageId: response });
  } catch (err) {
    console.error('[Califnco FCM] Send error:', err.message);
    return res.status(200).json({ success: false, error: err.message });
  }
}
