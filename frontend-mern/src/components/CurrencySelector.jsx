import { useState, useEffect } from 'react';
import {
  getSupportedCurrencies,
  convertCurrency,
  formatCurrency,
  getCurrencySymbol
} from '../services/currencyService';
import './CurrencySelector.css';

/**
 * Currency Selector Component
 * Allows users to select currency and see real-time conversion
 */
const CurrencySelector = ({
  amount,
  selectedCurrency,
  onCurrencyChange,
  showConversion = false,
  baseCurrency = 'USD'
}) => {
  const [currencies, setCurrencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [conversionRate, setConversionRate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCurrencies();
  }, []);

  useEffect(() => {
    if (
      showConversion &&
      amount &&
      selectedCurrency &&
      baseCurrency !== selectedCurrency
    ) {
      performConversion();
    }
  }, [amount, selectedCurrency, baseCurrency, showConversion]);

  const loadCurrencies = async () => {
    try {
      setIsLoading(true);
      const data = await getSupportedCurrencies();
      setCurrencies(data);
    } catch (err) {
      console.error('Load currencies error:', err);
      setError('Failed to load currencies');
    } finally {
      setIsLoading(false);
    }
  };

  const performConversion = async () => {
    try {
      const result = await convertCurrency(
        amount,
        baseCurrency,
        selectedCurrency
      );

      setConvertedAmount(result.convertedAmount);
      setConversionRate(result.rate);
      setError(null);
    } catch (err) {
      console.error('Conversion error:', err);
      setError('Failed to convert currency');
    }
  };

  const handleCurrencySelect = (e) => {
    const currency = e.target.value;
    onCurrencyChange(currency);
  };

  if (isLoading) {
    return (
      <div className="currency-selector loading">
        <span className="spinner">⏳</span>
        <span>Loading currencies...</span>
      </div>
    );
  }

  return (
    <div className="currency-selector">
      <div className="currency-select-wrapper">
        <label htmlFor="currency-select" className="currency-label">
          Currency
        </label>
        <select
          id="currency-select"
          value={selectedCurrency}
          onChange={handleCurrencySelect}
          className="currency-select"
        >
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.symbol} {currency.code} - {currency.name}
            </option>
          ))}
        </select>
      </div>

      {/* Conversion Display */}
      {showConversion && convertedAmount && (
        <div className="conversion-display">
          <div className="conversion-header">💱 Currency Conversion</div>
          <div className="conversion-details">
            <div className="conversion-row">
              <span className="conversion-label">Amount in {baseCurrency}:</span>
              <span className="conversion-value">
                {formatCurrency(amount, baseCurrency)}
              </span>
            </div>
            <div className="conversion-arrow">↓</div>
            <div className="conversion-row highlight">
              <span className="conversion-label">
                Converted to {selectedCurrency}:
              </span>
              <span className="conversion-value large">
                {formatCurrency(convertedAmount, selectedCurrency)}
              </span>
            </div>
            {conversionRate && (
              <div className="conversion-rate">
                <small>
                  1 {baseCurrency} = {conversionRate.toFixed(4)} {selectedCurrency}
                </small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="currency-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Compact Currency Selector (for forms)
 */
export const CompactCurrencySelector = ({
  value,
  onChange,
  className = ''
}) => {
  const [currencies, setCurrencies] = useState([]);

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      const data = await getSupportedCurrencies();
      setCurrencies(data);
    } catch (err) {
      console.error('Load currencies error:', err);
    }
  };

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`compact-currency-select ${className}`}
    >
      {currencies.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {currency.symbol} {currency.code}
        </option>
      ))}
    </select>
  );
};

/**
 * Currency Display Component (read-only with icon)
 */
export const CurrencyDisplay = ({ amount, currency = 'USD' }) => {
  const symbol = getCurrencySymbol(currency);

  return (
    <span className="currency-display">
      <span className="currency-symbol">{symbol}</span>
      <span className="currency-amount">
        {parseFloat(amount).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      </span>
      <span className="currency-code">{currency}</span>
    </span>
  );
};

/**
 * Currency Converter Widget (standalone)
 */
export const CurrencyConverter = () => {
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [result, setResult] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setIsConverting(true);
      const conversionResult = await convertCurrency(
        parseFloat(amount),
        fromCurrency,
        toCurrency
      );
      setResult(conversionResult);
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Failed to convert currency');
    } finally {
      setIsConverting(false);
    }
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setResult(null);
  };

  return (
    <div className="currency-converter-widget">
      <h3>💱 Currency Converter</h3>

      <div className="converter-form">
        <div className="converter-row">
          <div className="converter-field">
            <label>Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="0.01"
            />
          </div>
          <div className="converter-field">
            <label>From</label>
            <CompactCurrencySelector
              value={fromCurrency}
              onChange={setFromCurrency}
            />
          </div>
        </div>

        <div className="converter-swap">
          <button
            type="button"
            onClick={handleSwapCurrencies}
            className="btn-swap"
            title="Swap currencies"
          >
            ⇅
          </button>
        </div>

        <div className="converter-row">
          <div className="converter-field">
            <label>To</label>
            <CompactCurrencySelector value={toCurrency} onChange={setToCurrency} />
          </div>
        </div>

        <button
          onClick={handleConvert}
          disabled={isConverting}
          className="btn-convert"
        >
          {isConverting ? 'Converting...' : 'Convert'}
        </button>
      </div>

      {result && (
        <div className="converter-result">
          <div className="result-display">
            <div className="result-from">
              <CurrencyDisplay amount={result.amount} currency={result.from} />
            </div>
            <div className="result-equals">=</div>
            <div className="result-to">
              <CurrencyDisplay
                amount={result.convertedAmount}
                currency={result.to}
              />
            </div>
          </div>
          <div className="result-rate">
            Exchange rate: 1 {result.from} = {result.rate.toFixed(4)} {result.to}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
