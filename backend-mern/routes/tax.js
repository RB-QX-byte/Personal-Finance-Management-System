import express from 'express';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/tax/export
// @desc    Export transactions for tax purposes
// @access  Private
router.get('/export', async (req, res) => {
  try {
    const { year, format = 'json' } = req.query;

    if (!year) {
      return res.status(400).json({ error: 'Year is required' });
    }

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const transactions = await Transaction.find({
      userId: req.user._id,
      transactionDate: { $gte: startDate, $lte: endDate }
    })
      .populate('accountId', 'name accountType')
      .populate('categoryId', 'name')
      .sort({ transactionDate: 1 });

    // Calculate summaries
    const totalIncome = transactions
      .filter(t => t.transactionType === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.transactionType === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Group by category
    const categoryBreakdown = {};
    transactions.forEach(t => {
      if (t.categoryId) {
        const categoryName = t.categoryId.name;
        if (!categoryBreakdown[categoryName]) {
          categoryBreakdown[categoryName] = 0;
        }
        categoryBreakdown[categoryName] += t.amount;
      }
    });

    const exportData = {
      year: parseInt(year),
      summary: {
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses
      },
      categoryBreakdown,
      transactions: transactions.map(t => ({
        date: t.transactionDate,
        description: t.description,
        amount: t.amount,
        type: t.transactionType,
        category: t.categoryId?.name || 'Uncategorized',
        account: t.accountId?.name || 'Unknown'
      }))
    };

    if (format === 'csv') {
      // Generate CSV
      const csvRows = [
        ['Date', 'Description', 'Amount', 'Type', 'Category', 'Account'],
        ...exportData.transactions.map(t => [
          t.date.toISOString().split('T')[0],
          t.description,
          t.amount,
          t.type,
          t.category,
          t.account
        ])
      ];

      const csv = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=tax-export-${year}.csv`);
      res.send(csv);
    } else {
      res.json(exportData);
    }
  } catch (error) {
    console.error('Tax export error:', error);
    res.status(500).json({ error: 'Error exporting tax data' });
  }
});

export default router;
