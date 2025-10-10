import api from './api';

/**
 * AI-powered transaction categorization service
 * Uses GPT-4o-mini with learning from user patterns
 */

/**
 * Categorize a single transaction using AI
 * @param {Object} transactionData - Transaction details
 * @param {string} transactionData.description - Transaction description
 * @param {number} transactionData.amount - Transaction amount
 * @param {string} transactionData.merchant - Merchant name (optional)
 * @param {string} transactionData.date - Transaction date (optional)
 * @param {string} transactionData.account - Account name (optional)
 * @returns {Promise<Object>} Categorization result with prediction and alternatives
 */
export const categorizeTransaction = async (transactionData) => {
  try {
    const response = await api.post('/ai/categorize', {
      description: transactionData.description,
      amount: transactionData.amount,
      merchant: transactionData.merchant,
      date: transactionData.date,
      account: transactionData.account,
      transaction_type: transactionData.transaction_type || 'expense'
    });

    return response.data;
  } catch (error) {
    console.error('AI categorization error:', error);
    throw error;
  }
};

/**
 * Batch categorize multiple transactions
 * @param {Array<Object>} transactions - Array of transaction objects
 * @returns {Promise<Object>} Categorization results for all transactions
 */
export const batchCategorizeTransactions = async (transactions) => {
  try {
    const response = await api.post('/ai/batch-categorize', {
      transactions
    });

    return response.data;
  } catch (error) {
    console.error('Batch categorization error:', error);
    throw error;
  }
};

/**
 * Scan receipt image using OCR and AI extraction
 * @param {string} receiptText - OCR extracted text from receipt
 * @returns {Promise<Object>} Extracted transaction data
 */
export const scanReceipt = async (receiptText) => {
  try {
    const response = await api.post('/ai/receipt-scan', {
      text: receiptText
    });

    return response.data;
  } catch (error) {
    console.error('Receipt scan error:', error);
    throw error;
  }
};

/**
 * Get AI suggestions for transaction based on description
 * @param {string} description - Partial or full transaction description
 * @returns {Promise<Object>} Category suggestions
 */
export const getSuggestions = async (description) => {
  if (!description || description.length < 3) {
    return { suggestions: [] };
  }

  try {
    const response = await categorizeTransaction({
      description,
      amount: 0
    });

    return {
      suggestions: [
        {
          category: response.prediction.categoryName,
          categoryId: response.prediction.categoryId,
          confidence: response.prediction.confidence,
          reasoning: response.prediction.reasoning
        },
        ...response.alternatives.map(alt => ({
          category: alt.categoryName,
          categoryId: alt.categoryId,
          confidence: alt.confidence,
          reasoning: alt.reasoning
        }))
      ],
      isHighConfidence: response.isHighConfidence
    };
  } catch (error) {
    console.error('Get suggestions error:', error);
    return { suggestions: [] };
  }
};

/**
 * Check if AI service is available
 * @returns {Promise<boolean>} True if AI service is configured
 */
export const isAIAvailable = async () => {
  try {
    // Try a simple categorization to check if AI is available
    await categorizeTransaction({
      description: 'test',
      amount: 1
    });
    return true;
  } catch (error) {
    if (error.response?.status === 503) {
      return false; // Service not configured
    }
    // Other errors might be auth issues, so assume service is available
    return true;
  }
};

export default {
  categorizeTransaction,
  batchCategorizeTransactions,
  scanReceipt,
  getSuggestions,
  isAIAvailable
};
