import { useState, useEffect } from 'react';
import { categorizeTransaction } from '../services/aiService';
import './SmartTransactionForm.css';

/**
 * Smart Transaction Form with AI-powered category suggestions
 * Provides real-time category predictions as user types
 */
const SmartTransactionForm = ({
  initialData = {},
  categories = [],
  accounts = [],
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    transactionType: 'expense',
    categoryId: '',
    accountId: '',
    transactionDate: new Date().toISOString().split('T')[0],
    notes: '',
    ...initialData
  });

  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState({});

  // Auto-suggest categories when description changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.description.length >= 3 && !formData.categoryId) {
        fetchAISuggestions();
      }
    }, 800); // Debounce for 800ms

    return () => clearTimeout(timer);
  }, [formData.description]);

  const fetchAISuggestions = async () => {
    try {
      setIsLoadingSuggestions(true);
      const result = await categorizeTransaction({
        description: formData.description,
        amount: parseFloat(formData.amount) || 0,
        transaction_type: formData.transactionType
      });

      setAiSuggestions(result);
      setShowSuggestions(true);
    } catch (error) {
      console.error('AI suggestion error:', error);
      // Fail silently - don't disrupt user experience
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear suggestions when category is manually selected
    if (name === 'categoryId' && value) {
      setShowSuggestions(false);
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const applySuggestion = (categoryId, categoryName) => {
    setFormData(prev => ({
      ...prev,
      categoryId
    }));
    setShowSuggestions(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (!formData.accountId) {
      newErrors.accountId = 'Account is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  const handleGetSuggestion = async () => {
    if (formData.description.length < 3) {
      alert('Please enter at least 3 characters to get AI suggestions');
      return;
    }

    await fetchAISuggestions();
  };

  return (
    <form onSubmit={handleSubmit} className="smart-transaction-form">
      <h2>{initialData._id ? 'Edit Transaction' : 'Add Transaction'}</h2>

      {/* Transaction Type */}
      <div className="form-group">
        <label htmlFor="transactionType">Type *</label>
        <select
          id="transactionType"
          name="transactionType"
          value={formData.transactionType}
          onChange={handleChange}
          className="form-control"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      {/* Description with AI Button */}
      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <div className="description-input-group">
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g., Starbucks Coffee"
            className={`form-control ${errors.description ? 'is-invalid' : ''}`}
          />
          <button
            type="button"
            onClick={handleGetSuggestion}
            className="btn-ai-suggest"
            disabled={isLoadingSuggestions || formData.description.length < 3}
            title="Get AI category suggestion"
          >
            {isLoadingSuggestions ? (
              <span className="spinner">⏳</span>
            ) : (
              <span>✨ AI Suggest</span>
            )}
          </button>
        </div>
        {errors.description && (
          <div className="error-message">{errors.description}</div>
        )}
      </div>

      {/* AI Suggestions Display */}
      {showSuggestions && aiSuggestions && (
        <div className="ai-suggestions-panel">
          <div className="suggestion-header">
            <span className="ai-icon">🤖</span>
            <span>AI Suggestions</span>
            {aiSuggestions.isHighConfidence && (
              <span className="high-confidence-badge">High Confidence</span>
            )}
          </div>

          <div className="suggestion-primary">
            <div className="suggestion-content">
              <strong>{aiSuggestions.prediction.categoryName}</strong>
              <span className="confidence-badge">
                {aiSuggestions.prediction.confidence}% confidence
              </span>
              <p className="reasoning">{aiSuggestions.prediction.reasoning}</p>
            </div>
            <button
              type="button"
              onClick={() => applySuggestion(
                aiSuggestions.prediction.categoryId,
                aiSuggestions.prediction.categoryName
              )}
              className="btn-apply-suggestion"
            >
              Apply
            </button>
          </div>

          {aiSuggestions.alternatives && aiSuggestions.alternatives.length > 0 && (
            <div className="suggestion-alternatives">
              <p className="alternatives-label">Other options:</p>
              {aiSuggestions.alternatives.map((alt, index) => (
                <div key={index} className="suggestion-alt">
                  <div className="suggestion-content">
                    <strong>{alt.categoryName}</strong>
                    <span className="confidence-badge">{alt.confidence}%</span>
                    <p className="reasoning">{alt.reasoning}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applySuggestion(alt.categoryId, alt.categoryName)}
                    className="btn-apply-suggestion-small"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowSuggestions(false)}
            className="btn-close-suggestions"
          >
            ✕ Close
          </button>
        </div>
      )}

      {/* Amount */}
      <div className="form-group">
        <label htmlFor="amount">Amount *</label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          min="0"
          className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
        />
        {errors.amount && (
          <div className="error-message">{errors.amount}</div>
        )}
      </div>

      {/* Category Selection */}
      <div className="form-group">
        <label htmlFor="categoryId">Category *</label>
        <select
          id="categoryId"
          name="categoryId"
          value={formData.categoryId}
          onChange={handleChange}
          className={`form-control ${errors.categoryId ? 'is-invalid' : ''}`}
        >
          <option value="">Select category...</option>
          {categories
            .filter(cat => cat.type === formData.transactionType)
            .map(category => (
              <option key={category._id} value={category._id}>
                {category.icon} {category.name}
              </option>
            ))}
        </select>
        {errors.categoryId && (
          <div className="error-message">{errors.categoryId}</div>
        )}
      </div>

      {/* Account Selection */}
      <div className="form-group">
        <label htmlFor="accountId">Account *</label>
        <select
          id="accountId"
          name="accountId"
          value={formData.accountId}
          onChange={handleChange}
          className={`form-control ${errors.accountId ? 'is-invalid' : ''}`}
        >
          <option value="">Select account...</option>
          {accounts.map(account => (
            <option key={account._id} value={account._id}>
              {account.icon} {account.name}
            </option>
          ))}
        </select>
        {errors.accountId && (
          <div className="error-message">{errors.accountId}</div>
        )}
      </div>

      {/* Date */}
      <div className="form-group">
        <label htmlFor="transactionDate">Date *</label>
        <input
          type="date"
          id="transactionDate"
          name="transactionDate"
          value={formData.transactionDate}
          onChange={handleChange}
          className="form-control"
        />
      </div>

      {/* Notes */}
      <div className="form-group">
        <label htmlFor="notes">Notes (Optional)</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add any additional notes..."
          rows="3"
          className="form-control"
        />
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {initialData._id ? 'Update Transaction' : 'Add Transaction'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default SmartTransactionForm;
