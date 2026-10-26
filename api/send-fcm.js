import { getFirebaseAdmin } from './_firebase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { db, messaging } = getFirebaseAdmin();
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const {
      targetType = 'broadcast', // 'token' | 'user' | 'family' | 'broadcast'
      targetId,
      fcmToken,
      title = 'Kudumbam-Pay Notification',
      body = 'New update from Kudumbam-Pay',
      voiceText = '',
      txType = 'DEBIT',
      amount = '0',
      userName = 'Admin',
    } = data;

    let tokens = [];

    if (targetType === 'token' && fcmToken) {
      tokens = [fcmToken];
    } else if (targetType === 'user' && targetId) {
      const userDoc = await db.collection('users').doc(targetId).get();
      if (userDoc.exists && userDoc.data().fcmToken) {
        tokens.push(userDoc.data().fcmToken);
      }
      const doc = await db.collection('fcm_tokens').doc(targetId).get();
      if (doc.exists && doc.data().token) {
        tokens.push(doc.data().token);
      }
    } else if (targetType === 'family' && targetId) {
      const famDoc = await db.collection('families').doc(targetId).get();
      if (famDoc.exists) {
        const members = famDoc.data().members || [];
        for (const uid of members) {
          const uDoc = await db.collection('users').doc(uid).get();
          if (uDoc.exists && uDoc.data().fcmToken) {
            tokens.push(uDoc.data().fcmToken);
          }
          const tDoc = await db.collection('fcm_tokens').doc(uid).get();
          if (tDoc.exists && tDoc.data().token) {
            tokens.push(tDoc.data().token);
          }
        }
      }
    } else {
      // Broadcast: collect from both users (always has latest token) and fcm_tokens
      const usersSnap = await db.collection('users').get();
      const userTokens = usersSnap.docs.map((d) => d.data().fcmToken).filter(Boolean);

      const allTokensSnap = await db.collection('fcm_tokens').get();
      const fcmTokens = allTokensSnap.docs.map((d) => d.data().token).filter(Boolean);

      tokens = [...userTokens, ...fcmTokens];
    }

    tokens = Array.from(new Set(tokens));

    if (tokens.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No registered device FCM tokens found for target.',
      });
    }

    const payload = {
      notification: {
        title,
        body,
      },
      data: {
        title: String(title),
        body: String(body),
        voiceText: String(voiceText || body),
        txType: String(txType),
        amount: String(amount),
        userName: String(userName),
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'splendly_alerts_v2',
          sound: 'coinsound',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      tokens,
    };

    const response = await messaging.sendEachForMulticast(payload);

    return res.status(200).json({
      success: true,
      message: `Successfully dispatched to ${response.successCount} devices (${response.failureCount} failed)`,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    });
  } catch (error) {
    console.error('Error sending FCM push:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
