import { getFirebaseAdmin } from './_firebase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { db } = getFirebaseAdmin();
    const snapshot = await db.collection('families').get();
    const families = snapshot.docs.map((doc) => ({
      familyId: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ success: true, families });
  } catch (error) {
    console.error('Error fetching families:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
