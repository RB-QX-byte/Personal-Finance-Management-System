import express from 'express';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/dashboard
// @desc    Get dashboard data
// @access  Private
router.get('/', async (req, res) => {
  try {
    // Get all accounts with balances
    const accounts = await Account.find({ userId: req.user._id, isActive: true });
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

    // Get recent transactions (last 10)
    const recentTransactions = await Transaction.find({ userId: req.user._id })
      .populate('accountId', 'name accountType')
      .populate('categoryId', 'name color')
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(10);

    // Get current month income and expenses
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const monthlyTransactions = await Transaction.find({
      userId: req.user._id,
      transactionDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.transactionType === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.transactionType === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Get active budgets
    const budgets = await Budget.find({ userId: req.user._id, isActive: true })
      .populate('categoryId', 'name color')
      .limit(5);

    // Get active goals
    const goals = await Goal.find({ userId: req.user._id, isCompleted: false })
      .sort({ targetDate: 1 })
      .limit(5);

    // Get spending by category for current month
    const categorySpending = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          transactionType: 'expense',
          transactionDate: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      summary: {
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        netIncome: monthlyIncome - monthlyExpenses
      },
      accounts,
      recentTransactions,
      budgets,
      goals,
      categorySpending
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ error: 'Error fetching dashboard data' });
  }
});

export default router;
