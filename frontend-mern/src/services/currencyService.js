import api from './api';

/**
 * Multi-currency support service
 * Handles currency conversion, exchange rates, and formatting
 */

// Cache for exchange rates (1 hour)
let ratesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Get exchange rates for a base currency
 * @param {string} baseCurrency - Base currency code (e.g., 'USD')
 * @returns {Promise<Object>} Exchange rates object
 */
export const getExchangeRates = async (baseCurrency = 'USD') => {
  try {
    // Check cache
    if (ratesCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      return ratesCache;
    }

    const response = await api.get(`/currency/rates?base=${baseCurrency}`);

    if (response.data.rates) {
      ratesCache = response.data.rates;
      cacheTimestamp = Date.now();
    }

    return response.data;
  } catch (error) {
    console.error('Get exchange rates error:', error);
    // Return cached rates if available, even if stale
    if (ratesCache) {
      return { rates: ratesCache, cached: true, stale: true };
    }
    throw error;
  }
};

/**
 * Convert amount between currencies
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<Object>} Conversion result with rate and converted amount
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  try {
    if (fromCurrency === toCurrency) {
      return {
        amount: parseFloat(amount),
        from: fromCurrency,
        to: toCurrency,
        rate: 1,
        convertedAmount: parseFloat(amount)
      };
    }

    const response = await api.get('/currency/convert', {
      params: {
        amount,
        from: fromCurrency,
        to: toCurrency
      }
    });

    return response.data;
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw error;
  }
};

/**
 * Get list of supported currencies
 * @returns {Promise<Array>} Array of currency objects with code, name, and symbol
 */
export const getSupportedCurrencies = async () => {
  try {
    const response = await api.get('/currency/supported');
    return response.data;
  } catch (error) {
    console.error('Get supported currencies error:', error);
    // Return default currencies if API fails
    return [
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
  }
};

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted amount with currency symbol
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.error('Format currency error:', error);
    // Fallback to simple formatting
    return `${currency} ${parseFloat(amount).toFixed(2)}`;
  }
};

/**
 * Get currency symbol for a currency code
 * @param {string} currencyCode - Currency code (e.g., 'USD')
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: '$',
    AUD: '$',
    CHF: 'Fr',
    CNY: '¥',
    INR: '₹',
    BRL: 'R$',
    KRW: '₩',
    MXN: '$',
    RUB: '₽',
    ZAR: 'R',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    PLN: 'zł',
    THB: '฿',
    IDR: 'Rp',
    HUF: 'Ft',
    CZK: 'Kč',
    ILS: '₪',
    NZD: '$',
    PHP: '₱',
    SGD: '$',
    HKD: '$',
    TRY: '₺',
    AED: 'د.إ'
  };

  return symbols[currencyCode.toUpperCase()] || currencyCode;
};

/**
 * Convert multiple amounts to a target currency
 * @param {Array<Object>} amounts - Array of {amount, currency} objects
 * @param {string} targetCurrency - Target currency code
 * @returns {Promise<Array>} Array of conversion results
 */
export const convertMultiple = async (amounts, targetCurrency) => {
  try {
    const conversions = await Promise.all(
      amounts.map(item => convertCurrency(item.amount, item.currency, targetCurrency))
    );

    return conversions;
  } catch (error) {
    console.error('Convert multiple error:', error);
    throw error;
  }
};

/**
 * Get exchange rate between two currencies (without amount)
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {Promise<number>} Exchange rate
 */
export const getExchangeRate = async (fromCurrency, toCurrency) => {
  try {
    const result = await convertCurrency(1, fromCurrency, toCurrency);
    return result.rate;
  } catch (error) {
    console.error('Get exchange rate error:', error);
    throw error;
  }
};

/**
 * Clear the exchange rates cache
 */
export const clearCache = () => {
  ratesCache = null;
  cacheTimestamp = null;
};

export default {
  getExchangeRates,
  convertCurrency,
  getSupportedCurrencies,
  formatCurrency,
  getCurrencySymbol,
  convertMultiple,
  getExchangeRate,
  clearCache
};
