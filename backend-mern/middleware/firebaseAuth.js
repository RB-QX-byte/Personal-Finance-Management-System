import admin from 'firebase-admin';
import User from '../models/User.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin with service account
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../firebase-service-account.json'), 'utf8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Find or create user in MongoDB
      let user = await User.findOne({ firebaseUid: decodedToken.uid });

      if (!user) {
        // User doesn't exist in MongoDB, create one
        user = await User.create({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          fullName: decodedToken.name || '',
          currencyPreference: 'USD'
        });
      }

      // Attach user to request
      req.user = user;
      req.firebaseUser = decodedToken;

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Server error in auth middleware' });
  }
};
