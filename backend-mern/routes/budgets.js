import express from 'express';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/budgets
// @desc    Get all budgets for user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id })
      .populate('categoryId', 'name color')
      .sort({ createdAt: -1 });
    res.json(budgets);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Error fetching budgets' });
  }
});

// @route   GET /api/budgets/:id
// @desc    Get single budget
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('categoryId', 'name color');

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json(budget);
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ error: 'Error fetching budget' });
  }
});

// @route   POST /api/budgets
// @desc    Create a new budget
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { name, categoryId, amount, period, startDate, endDate, alertThreshold } = req.body;

    if (!name || !amount || !startDate || !endDate) {
      return res.status(400).json({ error: 'Name, amount, start date, and end date are required' });
    }

    const budget = await Budget.create({
      userId: req.user._id,
      name,
      categoryId: categoryId || null,
      amount: parseFloat(amount),
      period: period || 'monthly',
      startDate,
      endDate,
      alertThreshold: alertThreshold || 80
    });

    const populatedBudget = await Budget.findById(budget._id).populate('categoryId', 'name color');
    res.status(201).json(populatedBudget);
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Error creating budget' });
  }
});

// @route   PUT /api/budgets/:id
// @desc    Update a budget
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { name, categoryId, amount, period, startDate, endDate, alertThreshold, isActive } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, categoryId, amount, period, startDate, endDate, alertThreshold, isActive, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('categoryId', 'name color');

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json(budget);
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Error updating budget' });
  }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete a budget
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Error deleting budget' });
  }
});

// @route   GET /api/budgets/analytics
// @desc    Get budget analytics
// @access  Private
router.get('/analytics/data', async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id, isActive: true })
      .populate('categoryId', 'name color');

    const analytics = await Promise.all(budgets.map(async (budget) => {
      // Calculate spent amount based on transactions
      const transactions = await Transaction.find({
        userId: req.user._id,
        categoryId: budget.categoryId,
        transactionDate: { $gte: budget.startDate, $lte: budget.endDate },
        transactionType: 'expense'
      });

      const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
      const percentage = (spent / budget.amount) * 100;

      return {
        budget,
        spent,
        remaining: budget.amount - spent,
        percentage: Math.round(percentage),
        status: percentage >= 100 ? 'exceeded' : percentage >= budget.alertThreshold ? 'warning' : 'good'
      };
    }));

    res.json(analytics);
  } catch (error) {
    console.error('Get budget analytics error:', error);
    res.status(500).json({ error: 'Error fetching budget analytics' });
  }
});

export default router;
