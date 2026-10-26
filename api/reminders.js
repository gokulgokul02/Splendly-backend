import { getFirebaseAdmin } from './_firebase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { db, messaging } = getFirebaseAdmin();

  if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      let query = db.collection('reminders');

      if (userId) {
        query = query.where('toUserId', '==', userId);
      }

      const snapshot = await query.get();
      const reminders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      reminders.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

      return res.status(200).json({ success: true, reminders });
    } catch (error) {
      console.error('Error getting reminders:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        toUserId,
        fromName = 'Family Head',
        message = '',
        timestamp = new Date().toISOString(),
      } = data;

      if (!toUserId || !message) {
        return res.status(400).json({ success: false, message: 'toUserId and message are required' });
      }

      const reminderRef = data.id ? db.collection('reminders').doc(data.id) : db.collection('reminders').doc();
      const reminderData = {
        id: reminderRef.id,
        toUserId,
        fromName,
        message,
        isRead: false,
        timestamp,
        createdAt: new Date().toISOString(),
      };

      // 1. Save to Firestore
      await reminderRef.set(reminderData, { merge: true });

      // 2. Dispatch FCM Push Notification using Firebase Admin SDK
      let fcmSent = false;
      try {
        const tokenDoc = await db.collection('fcm_tokens').doc(toUserId).get();
        const userDoc = await db.collection('users').doc(toUserId).get();
        const token = tokenDoc.exists && tokenDoc.data().token ? tokenDoc.data().token : (userDoc.exists ? userDoc.data().fcmToken : null);

        if (token) {
          const notifTitle = `Family Reminder from ${fromName} 🔔`;
          const payload = {
            token,
            notification: {
              title: notifTitle,
              body: message,
            },
            data: {
              type: 'REMINDER',
              fromName: String(fromName),
              message: String(message),
              title: String(notifTitle),
              body: String(message),
              voiceText: `Reminder from ${fromName}: ${message}`,
              timestamp: new Date().toISOString(),
            },
            android: {
              priority: 'high',
              notification: {
                channelId: 'splendly_alerts_v3',
                sound: 'coinsound',
                defaultVibrateTimings: true,
                notificationPriority: 'PRIORITY_MAX',
                visibility: 'PUBLIC',
              },
            },
          };

          await messaging.send(payload);
          fcmSent = true;
          console.log(`🔔 FCM Reminder sent to ${toUserId}`);
        }
      } catch (fcmError) {
        console.warn('⚠️ FCM push warning for reminder:', fcmError);
      }

      return res.status(200).json({
        success: true,
        reminder: reminderData,
        fcmSent,
      });
    } catch (error) {
      console.error('Error saving reminder:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
