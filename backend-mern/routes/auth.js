import express from 'express';
import admin from 'firebase-admin';
import User from '../models/User.js';
import { verifyFirebaseToken } from '../middleware/firebaseAuth.js';

const router = express.Router();

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
