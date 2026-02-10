import express from 'express';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/tax/deductible
// @desc    Get tax-deductible transactions for a year
// @access  Private
router.get('/deductible', async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ error: 'Year is required' });
    }

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const transactions = await Transaction.find({
      userId: req.user._id,
      taxDeductible: true,
      transactionDate: { $gte: startDate, $lte: endDate }
    })
      .populate('accountId', 'name accountType')
      .populate('categoryId', 'name color')
      .sort({ transactionDate: -1 });

    res.json(transactions);
  } catch (error) {
    console.error('Get tax deductible transactions error:', error);
    res.status(500).json({ error: 'Error fetching tax-deductible transactions' });
  }
});

// @route   GET /api/tax/business-expenses
// @desc    Get business expense transactions for a year
// @access  Private
router.get('/business-expenses', async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ error: 'Year is required' });
    }

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const transactions = await Transaction.find({
      userId: req.user._id,
      businessExpense: true,
      transactionDate: { $gte: startDate, $lte: endDate }
    })
      .populate('accountId', 'name accountType')
      .populate('categoryId', 'name color')
      .sort({ transactionDate: -1 });

    res.json(transactions);
  } catch (error) {
    console.error('Get business expenses error:', error);
    res.status(500).json({ error: 'Error fetching business expenses' });
  }
});

// @route   GET /api/tax/summary
// @desc    Get tax summary for a year
// @access  Private
router.get('/summary', async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ error: 'Year is required' });
    }

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    // Get all transactions for the year
    const allTransactions = await Transaction.find({
      userId: req.user._id,
      transactionDate: { $gte: startDate, $lte: endDate }
    }).populate('categoryId', 'name');

    // Filter deductible and business expense transactions
    const deductibleTransactions = allTransactions.filter(t => t.taxDeductible);
    const businessTransactions = allTransactions.filter(t => t.businessExpense);

    const totalDeductible = deductibleTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalBusiness = businessTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate total income and expenses
    const totalIncome = allTransactions
      .filter(t => t.transactionType === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = allTransactions
      .filter(t => t.transactionType === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Group deductible by category
    const categoryBreakdown = {};
    deductibleTransactions.forEach(t => {
      const categoryName = t.categoryId?.name || 'Uncategorized';
      if (!categoryBreakdown[categoryName]) {
        categoryBreakdown[categoryName] = { total: 0, count: 0 };
      }
      categoryBreakdown[categoryName].total += t.amount;
      categoryBreakdown[categoryName].count++;
    });

    res.json({
      year: parseInt(year),
      deductibleCount: deductibleTransactions.length,
      deductibleTotal: Math.round(totalDeductible * 100) / 100,
      businessExpenseCount: businessTransactions.length,
      businessExpenseTotal: Math.round(totalBusiness * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netIncome: Math.round((totalIncome - totalExpenses) * 100) / 100,
      categoryBreakdown
    });
  } catch (error) {
    console.error('Get tax summary error:', error);
    res.status(500).json({ error: 'Error generating tax summary' });
  }
});

// @route   POST /api/tax/export
// @desc    Export tax data in specified format
// @access  Private
router.post('/export', async (req, res) => {
  try {
    const { year, format = 'json' } = req.body;

    if (!year) {
      return res.status(400).json({ error: 'Year is required' });
    }

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

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

    const deductibleTransactions = transactions.filter(t => t.taxDeductible);
    const businessTransactions = transactions.filter(t => t.businessExpense);

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
        netIncome: totalIncome - totalExpenses,
        totalDeductible: deductibleTransactions.reduce((sum, t) => sum + t.amount, 0),
        totalBusinessExpenses: businessTransactions.reduce((sum, t) => sum + t.amount, 0)
      },
      categoryBreakdown,
      transactions: transactions.map(t => ({
        date: t.transactionDate,
        description: t.description,
        amount: t.amount,
        type: t.transactionType,
        category: t.categoryId?.name || 'Uncategorized',
        account: t.accountId?.name || 'Unknown',
        taxDeductible: t.taxDeductible || false,
        businessExpense: t.businessExpense || false
      }))
    };

    if (format === 'csv') {
      // Generate CSV
      const csvRows = [
        ['Date', 'Description', 'Amount', 'Type', 'Category', 'Account', 'Tax Deductible', 'Business Expense'],
        ...exportData.transactions.map(t => [
          new Date(t.date).toISOString().split('T')[0],
          `"${t.description}"`,
          t.amount,
          t.type,
          t.category,
          t.account,
          t.taxDeductible ? 'Yes' : 'No',
          t.businessExpense ? 'Yes' : 'No'
        ])
      ];

      const csv = csvRows.map(row => row.join(',')).join('\n');

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

// @route   GET /api/tax/export
// @desc    Export tax data (backward compat GET version)
// @access  Private
router.get('/export', async (req, res) => {
  try {
    const { year, format = 'json' } = req.query;

    if (!year) {
      return res.status(400).json({ error: 'Year is required' });
    }

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const transactions = await Transaction.find({
      userId: req.user._id,
      transactionDate: { $gte: startDate, $lte: endDate }
    })
      .populate('accountId', 'name accountType')
      .populate('categoryId', 'name')
      .sort({ transactionDate: 1 });

    const totalIncome = transactions
      .filter(t => t.transactionType === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.transactionType === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

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
      const csvRows = [
        ['Date', 'Description', 'Amount', 'Type', 'Category', 'Account'],
        ...exportData.transactions.map(t => [
          new Date(t.date).toISOString().split('T')[0],
          `"${t.description}"`,
          t.amount,
          t.type,
          t.category,
          t.account
        ])
      ];

      const csv = csvRows.map(row => row.join(',')).join('\n');

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
