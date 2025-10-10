import ExchangeRate from '../models/ExchangeRate.js';
import axios from 'axios';

export class CurrencyService {
  static instance = null;

  constructor() {
    this.exchangeRates = new Map();
    this.lastUpdate = new Date(0);
    this.updateInterval = 60 * 60 * 1000; // 1 hour
  }

  static getInstance() {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  async convert(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: { amount, currency: fromCurrency },
        convertedAmount: { amount, currency: toCurrency },
        exchangeRate: 1,
        timestamp: new Date(),
        provider: 'same_currency'
      };
    }

    await this.updateRatesIfNeeded();
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rate.rate;

    return {
      originalAmount: { amount, currency: fromCurrency },
      convertedAmount: { amount: convertedAmount, currency: toCurrency },
      exchangeRate: rate.rate,
      timestamp: rate.timestamp,
      provider: rate.provider
    };
  }

  async getExchangeRate(fromCurrency, toCurrency) {
    const key = `${fromCurrency}_${toCurrency}`;
    const reverseKey = `${toCurrency}_${fromCurrency}`;

    if (this.exchangeRates.has(key)) {
      return this.exchangeRates.get(key);
    }

    if (this.exchangeRates.has(reverseKey)) {
      const reverseRate = this.exchangeRates.get(reverseKey);
      const rate = {
        baseCurrency: fromCurrency,
        targetCurrency: toCurrency,
        rate: 1 / reverseRate.rate,
        timestamp: reverseRate.timestamp,
        provider: reverseRate.provider
      };
      this.exchangeRates.set(key, rate);
      return rate;
    }

    const rate = await this.fetchExchangeRate(fromCurrency, toCurrency);
    this.exchangeRates.set(key, rate);
    return rate;
  }

  async updateRatesIfNeeded() {
    const now = new Date();
    if (now.getTime() - this.lastUpdate.getTime() > this.updateInterval) {
      await this.updateAllRates();
      this.lastUpdate = now;
    }
  }

  async fetchExchangeRate(fromCurrency, toCurrency) {
    try {
      const providers = [
        () => this.fetchFromExchangeRatesAPI(fromCurrency, toCurrency),
        () => this.fetchFromCurrencyAPI(fromCurrency, toCurrency),
      ];

      for (const provider of providers) {
        try {
          const rate = await provider();
          if (rate) {
            // Save to database
            await ExchangeRate.create({
              baseCurrency: fromCurrency,
              targetCurrency: toCurrency,
              rate: rate.rate,
              provider: rate.provider,
              timestamp: rate.timestamp
            }).catch(() => {}); // Ignore duplicate errors

            return rate;
          }
        } catch (error) {
          console.warn('Currency provider failed:', error.message);
        }
      }

      throw new Error('All currency providers failed');
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      return {
        baseCurrency: fromCurrency,
        targetCurrency: toCurrency,
        rate: 1,
        timestamp: new Date(),
        provider: 'fallback'
      };
    }
  }

  async fetchFromExchangeRatesAPI(fromCurrency, toCurrency) {
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const data = response.data;

    if (!data.rates || !data.rates[toCurrency]) {
      throw new Error(`Rate not found for ${fromCurrency} to ${toCurrency}`);
    }

    return {
      baseCurrency: fromCurrency,
      targetCurrency: toCurrency,
      rate: data.rates[toCurrency],
      timestamp: new Date(data.date),
      provider: 'exchangerate-api'
    };
  }

  async fetchFromCurrencyAPI(fromCurrency, toCurrency) {
    if (!process.env.CURRENCY_API_KEY) {
      throw new Error('CURRENCY_API_KEY not configured');
    }

    const response = await axios.get(`https://api.currencyapi.com/v3/latest`, {
      params: {
        apikey: process.env.CURRENCY_API_KEY,
        currencies: toCurrency,
        base_currency: fromCurrency
      }
    });
    const data = response.data;

    if (!data.data || !data.data[toCurrency]) {
      throw new Error(`Rate not found for ${fromCurrency} to ${toCurrency}`);
    }

    return {
      baseCurrency: fromCurrency,
      targetCurrency: toCurrency,
      rate: data.data[toCurrency].value,
      timestamp: new Date(data.meta.last_updated_at),
      provider: 'currencyapi'
    };
  }

  async updateAllRates() {
    const commonCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'KRW'];

    for (let i = 0; i < commonCurrencies.length; i++) {
      for (let j = i + 1; j < commonCurrencies.length; j++) {
        try {
          await this.fetchExchangeRate(commonCurrencies[i], commonCurrencies[j]);
        } catch (error) {
          console.warn(`Failed to update rate for ${commonCurrencies[i]} to ${commonCurrencies[j]}`);
        }
      }
    }
  }

  formatAmount(amount, currency, locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  getSupportedCurrencies() {
    return [
      'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'KRW',
      'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'RUB', 'BRL',
      'MXN', 'ZAR', 'TRY', 'NZD', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'AED'
    ];
  }

  getCurrencyName(currencyCode) {
    const currencyNames = {
      'USD': 'US Dollar', 'EUR': 'Euro', 'GBP': 'British Pound', 'JPY': 'Japanese Yen',
      'CAD': 'Canadian Dollar', 'AUD': 'Australian Dollar', 'CHF': 'Swiss Franc',
      'CNY': 'Chinese Yuan', 'INR': 'Indian Rupee', 'KRW': 'South Korean Won',
      'SGD': 'Singapore Dollar', 'HKD': 'Hong Kong Dollar', 'NOK': 'Norwegian Krone',
      'SEK': 'Swedish Krona', 'DKK': 'Danish Krone', 'PLN': 'Polish Zloty',
      'CZK': 'Czech Koruna', 'HUF': 'Hungarian Forint', 'RUB': 'Russian Ruble',
      'BRL': 'Brazilian Real', 'MXN': 'Mexican Peso', 'ZAR': 'South African Rand',
      'TRY': 'Turkish Lira', 'NZD': 'New Zealand Dollar', 'THB': 'Thai Baht',
      'MYR': 'Malaysian Ringgit', 'IDR': 'Indonesian Rupiah', 'PHP': 'Philippine Peso',
      'VND': 'Vietnamese Dong', 'AED': 'UAE Dirham'
    };

    return currencyNames[currencyCode] || currencyCode;
  }

  getCurrencySymbol(currencyCode) {
    const currencySymbols = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CAD': 'C$', 'AUD': 'A$',
      'CHF': 'Fr', 'CNY': '¥', 'INR': '₹', 'KRW': '₩', 'SGD': 'S$', 'HKD': 'HK$',
      'NOK': 'kr', 'SEK': 'kr', 'DKK': 'kr', 'PLN': 'zł', 'CZK': 'Kč', 'HUF': 'Ft',
      'RUB': '₽', 'BRL': 'R$', 'MXN': '$', 'ZAR': 'R', 'TRY': '₺', 'NZD': 'NZ$',
      'THB': '฿', 'MYR': 'RM', 'IDR': 'Rp', 'PHP': '₱', 'VND': '₫', 'AED': 'د.إ'
    };

    return currencySymbols[currencyCode] || currencyCode;
  }

  async convertToBaseCurrency(amount, currency, baseCurrency) {
    if (currency === baseCurrency) {
      return amount;
    }

    const conversion = await this.convert(amount, currency, baseCurrency);
    return conversion.convertedAmount.amount;
  }

  clearCache() {
    this.exchangeRates.clear();
    this.lastUpdate = new Date(0);
  }
}

export default CurrencyService.getInstance();
