import express from 'express';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/transactions
// @desc    Get all transactions for user with filters
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { account_id, category_id, start_date, end_date, search, limit = 50, offset = 0 } = req.query;

    let query = { userId: req.user._id };

    // Apply filters
    if (account_id) query.accountId = account_id;
    if (category_id) query.categoryId = category_id;
    if (start_date) query.transactionDate = { ...query.transactionDate, $gte: new Date(start_date) };
    if (end_date) query.transactionDate = { ...query.transactionDate, $lte: new Date(end_date) };
    if (search) query.description = { $regex: search, $options: 'i' };

    const transactions = await Transaction.find(query)
      .populate('accountId', 'name accountType')
      .populate('categoryId', 'name color')
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { account_id, category_id, amount, transaction_type, description, transaction_date, notes } = req.body;

    // Validate required fields
    if (!account_id || !amount || !transaction_type) {
      return res.status(400).json({ error: 'Account ID, amount, and transaction type are required' });
    }

    // Validate transaction type
    const validTypes = ['income', 'expense', 'transfer'];
    if (!validTypes.includes(transaction_type)) {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    // Validate amount
    if (parseFloat(amount) === 0) {
      return res.status(400).json({ error: 'Amount cannot be zero' });
    }

    // Verify account belongs to user
    const account = await Account.findOne({ _id: account_id, userId: req.user._id });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Create transaction
    const transaction = await Transaction.create({
      userId: req.user._id,
      accountId: account_id,
      categoryId: category_id || null,
      amount: parseFloat(amount),
      transactionType: transaction_type,
      description: description || '',
      transactionDate: transaction_date || new Date(),
      notes: notes || ''
    });

    // Update account balance
    const amountValue = parseFloat(amount);
    if (transaction_type === 'income') {
      account.balance += amountValue;
    } else if (transaction_type === 'expense') {
      account.balance -= amountValue;
    }
    await account.save();

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('accountId', 'name accountType')
      .populate('categoryId', 'name color');

    res.status(201).json(populatedTransaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Error creating transaction' });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update a transaction
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { account_id, category_id, amount, transaction_type, description, transaction_date, notes } = req.body;

    // Find existing transaction
    const existingTransaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // If amount or type changed, update account balance
    if (amount !== undefined || transaction_type !== undefined) {
      const oldAccount = await Account.findById(existingTransaction.accountId);

      // Reverse old transaction
      if (existingTransaction.transactionType === 'income') {
        oldAccount.balance -= existingTransaction.amount;
      } else if (existingTransaction.transactionType === 'expense') {
        oldAccount.balance += existingTransaction.amount;
      }

      // Apply new transaction
      const newAmount = amount !== undefined ? parseFloat(amount) : existingTransaction.amount;
      const newType = transaction_type || existingTransaction.transactionType;

      if (newType === 'income') {
        oldAccount.balance += newAmount;
      } else if (newType === 'expense') {
        oldAccount.balance -= newAmount;
      }

      await oldAccount.save();
    }

    // Build update object
    const updateData = {};
    if (account_id) updateData.accountId = account_id;
    if (category_id !== undefined) updateData.categoryId = category_id;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (transaction_type) updateData.transactionType = transaction_type;
    if (description !== undefined) updateData.description = description;
    if (transaction_date) updateData.transactionDate = transaction_date;
    if (notes !== undefined) updateData.notes = notes;
    updateData.updatedAt = Date.now();

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('accountId', 'name accountType')
      .populate('categoryId', 'name color');

    res.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Error updating transaction' });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update account balance
    const account = await Account.findById(transaction.accountId);
    if (account) {
      if (transaction.transactionType === 'income') {
        account.balance -= transaction.amount;
      } else if (transaction.transactionType === 'expense') {
        account.balance += transaction.amount;
      }
      await account.save();
    }

    await Transaction.findByIdAndDelete(req.params.id);

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Error deleting transaction' });
  }
});

export default router;
