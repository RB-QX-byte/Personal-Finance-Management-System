import express from 'express';
import axios from 'axios';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// In-memory cache for exchange rates (expires after 1 hour)
let ratesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// @route   GET /api/currency/rates
// @desc    Get current exchange rates
// @access  Private
router.get('/rates', async (req, res) => {
  try {
    const { base = 'USD' } = req.query;

    // Check cache
    if (ratesCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      return res.json({ rates: ratesCache, base, cached: true });
    }

    // Fetch fresh rates from exchangerate-api.com (free tier)
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${base}`);

    if (response.data && response.data.rates) {
      ratesCache = response.data.rates;
      cacheTimestamp = Date.now();

      res.json({ rates: ratesCache, base, cached: false });
    } else {
      res.status(500).json({ error: 'Unable to fetch exchange rates' });
    }
  } catch (error) {
    console.error('Get rates error:', error);

    // Return cached rates if available, even if expired
    if (ratesCache) {
      return res.json({ rates: ratesCache, base: 'USD', cached: true, stale: true });
    }

    res.status(500).json({ error: 'Error fetching exchange rates' });
  }
});

// @route   GET /api/currency/convert
// @desc    Convert amount between currencies
// @access  Private
router.get('/convert', async (req, res) => {
  try {
    const { amount, from = 'USD', to = 'USD' } = req.query;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    // Fetch rates
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`);

    if (response.data && response.data.rates && response.data.rates[to]) {
      const rate = response.data.rates[to];
      const convertedAmount = parseFloat(amount) * rate;

      res.json({
        amount: parseFloat(amount),
        from,
        to,
        rate,
        convertedAmount: Math.round(convertedAmount * 100) / 100
      });
    } else {
      res.status(500).json({ error: 'Unable to convert currency' });
    }
  } catch (error) {
    console.error('Currency conversion error:', error);
    res.status(500).json({ error: 'Error converting currency' });
  }
});

// @route   GET /api/currency/supported
// @desc    Get list of supported currencies
// @access  Private
router.get('/supported', async (req, res) => {
  try {
    const currencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' }
    ];

    res.json(currencies);
  } catch (error) {
    console.error('Get supported currencies error:', error);
    res.status(500).json({ error: 'Error fetching supported currencies' });
  }
});

export default router;
