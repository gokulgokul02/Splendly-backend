import { getFirebaseAdmin } from './_firebase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { db } = getFirebaseAdmin();

    const [usersSnap, familiesSnap, txsSnap, remindersSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('families').get(),
      db.collection('transactions').get(),
      db.collection('reminders').get(),
    ]);

    let totalExpense = 0;
    let totalIncome = 0;

    txsSnap.forEach((doc) => {
      const data = doc.data();
      const amount = Number(data.amount) || 0;
      const type = (data.type || '').toUpperCase();
      if (type === 'CREDIT' || type === 'INCOME') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers: usersSnap.size,
        totalFamilies: familiesSnap.size,
        totalTransactions: txsSnap.size,
        totalReminders: remindersSnap.size,
        totalExpense,
        totalIncome,
        netBalance: totalIncome - totalExpense,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
