import express from 'express';
import admin from 'firebase-admin';
import User from '../models/User.js';
import { verifyFirebaseToken } from '../middleware/firebaseAuth.js';

const router = express.Router();

// Initialize Firebase Admin if not already initialized
function initializeFirebase() {
  if (admin.apps.length) {
    return; // Already initialized
  }

  try {
    const serviceAccount = {
      type: process.env.FIREBASE_TYPE || 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
      universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || 'googleapis.com'
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error.message);
    throw error;
  }
}

// Initialize Firebase on module load
initializeFirebase();

// @route   POST /api/auth/firebase-register
// @desc    Register with Firebase (create user in MongoDB)
// @access  Public
router.post('/firebase-register', async (req, res) => {
  try {
    const { idToken, email, displayName, uid, currencyPreference } = req.body;

    if (!idToken || !email || !uid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (decodedToken.uid !== uid) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user already exists
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Create new user in MongoDB
      user = await User.create({
        firebaseUid: uid,
        email,
        fullName: displayName || '',
        currencyPreference: currencyPreference || 'USD'
      });
    }

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        currencyPreference: user.currencyPreference
      }
    });
  } catch (error) {
    console.error('Firebase register error:', error);

    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Server error during registration' });
  }
});

// @route   POST /api/auth/firebase-login
// @desc    Login with Firebase (sync with MongoDB)
// @access  Public
router.post('/firebase-login', async (req, res) => {
  try {
    const { idToken, email, displayName, uid } = req.body;

    if (!idToken || !uid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (decodedToken.uid !== uid) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Find or create user in MongoDB
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email: email || decodedToken.email,
        fullName: displayName || decodedToken.name || '',
        currencyPreference: 'USD'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        currencyPreference: user.currencyPreference
      }
    });
  } catch (error) {
    console.error('Firebase login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', verifyFirebaseToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', verifyFirebaseToken, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      fullName: req.user.fullName,
      currencyPreference: req.user.currencyPreference
    }
  });
});

export default router;
