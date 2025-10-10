import express from 'express';
import OpenAI from 'openai';
import Category from '../models/Category.js';
import { protect } from '../middleware/auth.js';
import { createAICategorizationService } from '../services/aiCategorization.js';

const router = express.Router();

router.use(protect);

// Initialize OpenAI (only if API key is provided)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// @route   POST /api/ai/categorize
// @desc    Advanced AI-based transaction categorization with learning
// @access  Private
router.post('/categorize', async (req, res) => {
  try {
    const { description, amount, transaction_type, merchant, date, account } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    if (!openai) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    // Use advanced AI categorization service
    const aiService = await createAICategorizationService(req.user._id);
    const result = await aiService.categorizeTransaction({
      description,
      amount: amount || 0,
      merchant,
      date,
      account
    });

    res.json({
      prediction: result.prediction,
      alternatives: result.alternatives,
      isHighConfidence: result.isHighConfidence
    });
  } catch (error) {
    console.error('AI categorization error:', error);
    res.status(500).json({ error: 'Error with AI categorization' });
  }
});

// @route   POST /api/ai/batch-categorize
// @desc    Batch categorize multiple transactions
// @access  Private
router.post('/batch-categorize', async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: 'Transactions array is required' });
    }

    if (!openai) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const aiService = await createAICategorizationService(req.user._id);
    const results = await aiService.batchCategorizeTransactions(transactions);

    res.json({ results });
  } catch (error) {
    console.error('Batch categorization error:', error);
    res.status(500).json({ error: 'Error with batch categorization' });
  }
});

// @route   POST /api/ai/receipt-scan
// @desc    Extract transaction data from receipt image
// @access  Private
router.post('/receipt-scan', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Receipt text is required' });
    }

    if (!openai) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const prompt = `Extract transaction information from this receipt text: "${text}". Return JSON with fields: merchant (string), amount (number), date (YYYY-MM-DD format), items (array of strings). If any field cannot be determined, use null.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a receipt parsing assistant. Extract structured transaction data from receipt text.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 200
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    const extractedData = JSON.parse(responseText);

    res.json({
      success: true,
      data: {
        description: extractedData.merchant || 'Unknown Merchant',
        amount: extractedData.amount || 0,
        date: extractedData.date || new Date().toISOString().split('T')[0],
        items: extractedData.items || []
      }
    });
  } catch (error) {
    console.error('Receipt scan error:', error);
    res.status(500).json({ error: 'Error scanning receipt' });
  }
});

export default router;
