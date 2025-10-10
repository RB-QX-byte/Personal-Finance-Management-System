import express from 'express';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Category from '../models/Category.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/reports/monthly-summary
// @desc    Get monthly income/expense summary
// @access  Private
router.get('/monthly-summary', async (req, res) => {
  try {
    const { month, year } = req.query;

    // Default to current month/year
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    // Validate parameters
    if (targetMonth < 1 || targetMonth > 12) {
      return res.status(400).json({ error: 'Invalid month parameter. Must be between 1 and 12' });
    }

    if (targetYear < 1900 || targetYear > 2100) {
      return res.status(400).json({ error: 'Invalid year parameter. Must be between 1900 and 2100' });
    }

    // Calculate date range for the month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Get all transactions for the month
    const transactions = await Transaction.find({
      userId: req.user._id,
      transactionDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('categoryId');

    // Calculate summary
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown = {};

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);

      if (transaction.transactionType === 'income') {
        totalIncome += amount;
      } else if (transaction.transactionType === 'expense') {
        totalExpense += amount;
      }

      // Category breakdown
      if (transaction.categoryId) {
        const categoryName = transaction.categoryId.name;
        if (!categoryBreakdown[categoryName]) {
          categoryBreakdown[categoryName] = {
            income: 0,
            expense: 0,
            count: 0
          };
        }

        if (transaction.transactionType === 'income') {
          categoryBreakdown[categoryName].income += amount;
        } else {
          categoryBreakdown[categoryName].expense += amount;
        }
        categoryBreakdown[categoryName].count++;
      }
    });

    const netCashFlow = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netCashFlow / totalIncome) * 100) : 0;

    res.json({
      month: targetMonth,
      year: targetYear,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      netCashFlow: Math.round(netCashFlow * 100) / 100,
      savingsRate: Math.round(savingsRate * 100) / 100,
      transactionCount: transactions.length,
      categoryBreakdown,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Monthly summary error:', error);
    res.status(500).json({ error: 'Error generating monthly summary' });
  }
});

// @route   GET /api/reports/spending-trends
// @desc    Get spending trends over time
// @access  Private
router.get('/spending-trends', async (req, res) => {
  try {
    const { months = 12, category_id } = req.query;

    const monthsNum = parseInt(months);
    if (monthsNum < 1 || monthsNum > 60) {
      return res.status(400).json({ error: 'Invalid months parameter. Must be between 1 and 60' });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsNum);

    // Build query
    const query = {
      userId: req.user._id,
      transactionDate: {
        $gte: startDate,
        $lte: endDate
      }
    };

    if (category_id) {
      query.categoryId = category_id;
    }

    // Get transactions
    const transactions = await Transaction.find(query).populate('categoryId');

    // Group by month
    const monthlyData = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.transactionDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          income: 0,
          expense: 0,
          net: 0,
          transactionCount: 0
        };
      }

      const amount = parseFloat(transaction.amount);

      if (transaction.transactionType === 'income') {
        monthlyData[monthKey].income += amount;
      } else if (transaction.transactionType === 'expense') {
        monthlyData[monthKey].expense += amount;
      }

      monthlyData[monthKey].net = monthlyData[monthKey].income - monthlyData[monthKey].expense;
      monthlyData[monthKey].transactionCount++;
    });

    // Convert to array and sort
    const trends = Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(data => ({
        ...data,
        income: Math.round(data.income * 100) / 100,
        expense: Math.round(data.expense * 100) / 100,
        net: Math.round(data.net * 100) / 100
      }));

    // Calculate averages
    const avgIncome = trends.length > 0
      ? trends.reduce((sum, t) => sum + t.income, 0) / trends.length
      : 0;
    const avgExpense = trends.length > 0
      ? trends.reduce((sum, t) => sum + t.expense, 0) / trends.length
      : 0;

    res.json({
      trends,
      summary: {
        averageIncome: Math.round(avgIncome * 100) / 100,
        averageExpense: Math.round(avgExpense * 100) / 100,
        averageNet: Math.round((avgIncome - avgExpense) * 100) / 100,
        monthsAnalyzed: trends.length
      },
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Spending trends error:', error);
    res.status(500).json({ error: 'Error generating spending trends' });
  }
});

// @route   GET /api/reports/cash-flow
// @desc    Get cash flow report for date range
// @access  Private
router.get('/cash-flow', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Default to current month if no dates provided
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    let startDate, endDate;

    if (start_date) {
      startDate = new Date(start_date);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ error: 'Invalid start_date format. Use YYYY-MM-DD' });
      }
    } else {
      startDate = defaultStart;
    }

    if (end_date) {
      endDate = new Date(end_date);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid end_date format. Use YYYY-MM-DD' });
      }
    } else {
      endDate = defaultEnd;
    }

    // Validate date range
    if (endDate < startDate) {
      return res.status(400).json({ error: 'end_date must be after start_date' });
    }

    const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      return res.status(400).json({ error: 'Date range cannot exceed 365 days' });
    }

    // Get transactions
    const transactions = await Transaction.find({
      userId: req.user._id,
      transactionDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('categoryId').sort({ transactionDate: 1 });

    // Calculate daily cash flow
    const dailyCashFlow = {};
    let runningBalance = 0;

    transactions.forEach(transaction => {
      const dateKey = transaction.transactionDate.toISOString().split('T')[0];

      if (!dailyCashFlow[dateKey]) {
        dailyCashFlow[dateKey] = {
          date: dateKey,
          income: 0,
          expense: 0,
          net: 0,
          balance: 0,
          transactions: []
        };
      }

      const amount = parseFloat(transaction.amount);

      if (transaction.transactionType === 'income') {
        dailyCashFlow[dateKey].income += amount;
        runningBalance += amount;
      } else if (transaction.transactionType === 'expense') {
        dailyCashFlow[dateKey].expense += amount;
        runningBalance -= amount;
      }

      dailyCashFlow[dateKey].net = dailyCashFlow[dateKey].income - dailyCashFlow[dateKey].expense;
      dailyCashFlow[dateKey].balance = runningBalance;
      dailyCashFlow[dateKey].transactions.push({
        id: transaction._id,
        description: transaction.description,
        amount: amount,
        type: transaction.transactionType,
        category: transaction.categoryId?.name || 'Uncategorized'
      });
    });

    // Convert to array and sort
    const cashFlowData = Object.values(dailyCashFlow)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(data => ({
        ...data,
        income: Math.round(data.income * 100) / 100,
        expense: Math.round(data.expense * 100) / 100,
        net: Math.round(data.net * 100) / 100,
        balance: Math.round(data.balance * 100) / 100
      }));

    // Calculate totals
    const totalIncome = cashFlowData.reduce((sum, d) => sum + d.income, 0);
    const totalExpense = cashFlowData.reduce((sum, d) => sum + d.expense, 0);

    res.json({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dailyCashFlow: cashFlowData,
      summary: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netCashFlow: Math.round((totalIncome - totalExpense) * 100) / 100,
        finalBalance: cashFlowData.length > 0 ? cashFlowData[cashFlowData.length - 1].balance : 0,
        daysAnalyzed: Object.keys(dailyCashFlow).length
      },
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Cash flow error:', error);
    res.status(500).json({ error: 'Error generating cash flow report' });
  }
});

// @route   GET /api/reports/summary
// @desc    Get comprehensive report summary
// @access  Private
router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Calculate date ranges
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get current month transactions
    const monthlyTransactions = await Transaction.find({
      userId: req.user._id,
      transactionDate: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    }).populate('categoryId');

    // Calculate monthly summary
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    monthlyTransactions.forEach(t => {
      const amount = parseFloat(t.amount);
      if (t.transactionType === 'income') monthlyIncome += amount;
      else if (t.transactionType === 'expense') monthlyExpense += amount;
    });

    // Get 6-month trends
    const trendTransactions = await Transaction.find({
      userId: req.user._id,
      transactionDate: {
        $gte: sixMonthsAgo,
        $lte: now
      }
    });

    const monthlyTrends = {};
    trendTransactions.forEach(t => {
      const date = new Date(t.transactionDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyTrends[monthKey]) {
        monthlyTrends[monthKey] = { income: 0, expense: 0 };
      }

      const amount = parseFloat(t.amount);
      if (t.transactionType === 'income') monthlyTrends[monthKey].income += amount;
      else if (t.transactionType === 'expense') monthlyTrends[monthKey].expense += amount;
    });

    res.json({
      userId: req.user._id.toString(),
      generatedAt: now,
      currentMonth: {
        month: currentMonth,
        year: currentYear,
        totalIncome: Math.round(monthlyIncome * 100) / 100,
        totalExpense: Math.round(monthlyExpense * 100) / 100,
        netCashFlow: Math.round((monthlyIncome - monthlyExpense) * 100) / 100,
        transactionCount: monthlyTransactions.length
      },
      spendingTrends: Object.entries(monthlyTrends)
        .map(([month, data]) => ({
          month,
          income: Math.round(data.income * 100) / 100,
          expense: Math.round(data.expense * 100) / 100,
          net: Math.round((data.income - data.expense) * 100) / 100
        }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      cashFlow: {
        totalIncome: Math.round(monthlyIncome * 100) / 100,
        totalExpense: Math.round(monthlyExpense * 100) / 100,
        netCashFlow: Math.round((monthlyIncome - monthlyExpense) * 100) / 100
      }
    });
  } catch (error) {
    console.error('Report summary error:', error);
    res.status(500).json({ error: 'Error generating report summary' });
  }
});

// @route   GET /api/reports/budget-performance
// @desc    Get budget vs actual spending performance
// @access  Private
router.get('/budget-performance', async (req, res) => {
  try {
    const { month, year } = req.query;

    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    // Validate parameters
    if (targetMonth < 1 || targetMonth > 12) {
      return res.status(400).json({ error: 'Invalid month parameter. Must be between 1 and 12' });
    }

    if (targetYear < 1900 || targetYear > 2100) {
      return res.status(400).json({ error: 'Invalid year parameter. Must be between 1900 and 2100' });
    }

    // Calculate date range
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Get all active budgets for user
    const budgets = await Budget.find({ userId: req.user._id }).populate('categoryId');

    // Get all expense transactions for the period
    const transactions = await Transaction.find({
      userId: req.user._id,
      transactionType: 'expense',
      transactionDate: {
        $gte: startDate,
        $lte: endDate
      }
    });

    // Calculate spending by category
    const categorySpending = {};
    transactions.forEach(t => {
      const categoryId = t.categoryId?.toString();
      if (categoryId) {
        categorySpending[categoryId] = (categorySpending[categoryId] || 0) + parseFloat(t.amount);
      }
    });

    // Analyze each budget
    const budgetPerformance = [];
    let totalBudgeted = 0;
    let totalSpent = 0;
    let overBudgetCount = 0;

    for (const budget of budgets) {
      const categoryId = budget.categoryId?._id?.toString();
      const budgetAmount = parseFloat(budget.amount);
      const spentAmount = categorySpending[categoryId] || 0;
      const remaining = budgetAmount - spentAmount;
      const percentageUsed = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
      const isOverBudget = spentAmount > budgetAmount;

      if (isOverBudget) overBudgetCount++;

      totalBudgeted += budgetAmount;
      totalSpent += spentAmount;

      // Determine status
      let status = 'under_budget';
      if (isOverBudget) {
        status = 'over_budget';
      } else if (percentageUsed >= 80) {
        status = 'at_risk';
      }

      budgetPerformance.push({
        budgetId: budget._id,
        budgetName: budget.categoryId?.name || 'Unknown',
        categoryId: categoryId,
        budgetedAmount: Math.round(budgetAmount * 100) / 100,
        spentAmount: Math.round(spentAmount * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        status,
        isOverBudget,
        period: budget.period || 'monthly'
      });
    }

    // Calculate overall performance
    const overallPerformance = {
      totalBudgeted: Math.round(totalBudgeted * 100) / 100,
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalRemaining: Math.round((totalBudgeted - totalSpent) * 100) / 100,
      overallPercentage: totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100 * 100) / 100 : 0,
      budgetsCount: budgets.length,
      overBudgetCount,
      onTrackCount: budgets.length - overBudgetCount
    };

    res.json({
      userId: req.user._id.toString(),
      month: targetMonth,
      year: targetYear,
      budgetPerformance,
      overallPerformance,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Budget performance error:', error);
    res.status(500).json({ error: 'Error generating budget performance report' });
  }
});

export default router;
