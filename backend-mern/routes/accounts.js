import express from 'express';
import Account from '../models/Account.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/accounts
// @desc    Get all accounts for user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Error fetching accounts' });
  }
});

// @route   POST /api/accounts
// @desc    Create a new account
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { name, accountType, balance, currency, icon, color } = req.body;

    if (!name || !accountType) {
      return res.status(400).json({ error: 'Name and account type are required' });
    }

    const account = await Account.create({
      userId: req.user._id,
      name,
      accountType,
      balance: balance || 0,
      currency: currency || 'USD',
      icon: icon || 'bank',
      color: color || '#3b82f6'
    });

    res.status(201).json(account);
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Error creating account' });
  }
});

// @route   PUT /api/accounts/:id
// @desc    Update an account
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { name, accountType, balance, currency, icon, color, isActive } = req.body;

    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, accountType, balance, currency, icon, color, isActive, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Error updating account' });
  }
});

// @route   DELETE /api/accounts/:id
// @desc    Delete an account
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Error deleting account' });
  }
});

export default router;
