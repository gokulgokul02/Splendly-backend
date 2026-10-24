import { getFirebaseAdmin } from './_firebase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { db, messaging } = getFirebaseAdmin();

  if (req.method === 'GET') {
    try {
      const { familyId } = req.query;
      let query = db.collection('transactions');

      if (familyId) {
        query = query.where('familyId', '==', familyId);
      }

      const snapshot = await query.get();
      const transactions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      transactions.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

      return res.status(200).json({ success: true, transactions });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        familyId,
        userId,
        userName = 'Member',
        amount = 0,
        category = 'General',
        type = 'DEBIT',
        note = '',
        timestamp = new Date().toISOString(),
      } = data;

      if (!familyId || !userId || !amount) {
        return res.status(400).json({ success: false, message: 'familyId, userId, and amount are required' });
      }

      const txId = data.id || `tx_${Date.now()}`;
      const isIncome = type.toUpperCase() === 'CREDIT' || type.toUpperCase() === 'INCOME';
      const parsedAmount = Number(amount);

      const txRecord = {
        id: txId,
        familyId,
        userId,
        userName,
        amount: parsedAmount,
        category,
        type: isIncome ? 'CREDIT' : 'DEBIT',
        note,
        timestamp,
        createdAt: new Date().toISOString(),
      };

      // 1. Save to Firestore
      await db.collection('transactions').doc(txId).set(txRecord);

      // 2. Dispatch FCM Push Notification to other family members with Voice announcement
      try {
        const familyDoc = await db.collection('families').doc(familyId).get();
        if (familyDoc.exists) {
          const members = familyDoc.data().members || [];
          const recipientIds = members.filter((uid) => uid !== userId);

          const tokens = [];
          for (const recipientId of recipientIds) {
            const tokenDoc = await db.collection('fcm_tokens').doc(recipientId).get();
            if (tokenDoc.exists && tokenDoc.data().token) {
              tokens.push(tokenDoc.data().token);
            }
          }

          if (tokens.length > 0) {
            const typeText = isIncome ? 'Credited' : 'Debited';
            const voiceText = isIncome
              ? `${userName} added ${parsedAmount} rupees`
              : `${userName} spent ${parsedAmount} rupees`;

            const messagePayload = {
              notification: {
                title: `Kudumbam-Pay: ₹${parsedAmount} ${typeText} 💸`,
                body: `${userName} added ₹${parsedAmount} ${typeText} for ${note || category}`,
              },
              data: {
                type: 'TRANSACTION',
                txType: isIncome ? 'CREDIT' : 'DEBIT',
                amount: String(parsedAmount),
                userName: String(userName),
                note: String(note),
                category: String(category),
                voiceText: String(voiceText),
                timestamp: new Date().toISOString(),
              },
              android: {
                priority: 'high',
                notification: {
                  channelId: 'splendly_alerts_v2',
                  sound: 'coinsound',
                },
              },
              tokens: Array.from(new Set(tokens)),
            };

            const sendRes = await messaging.sendEachForMulticast(messagePayload);
            console.log(`🔔 FCM Broadcast: ${sendRes.successCount} sent, ${sendRes.failureCount} failed.`);
          }
        }
      } catch (fcmError) {
        console.warn('⚠️ FCM Push failed (Transaction saved in Firestore successfully):', fcmError);
      }

      return res.status(200).json({ success: true, transaction: txRecord });
    } catch (error) {
      console.error('Error saving transaction:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
