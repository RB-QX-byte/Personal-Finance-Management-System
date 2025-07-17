export interface ExchangeRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  timestamp: Date;
  provider: string;
}

export interface CurrencyAmount {
  amount: number;
  currency: string;
}

export interface ConversionResult {
  originalAmount: CurrencyAmount;
  convertedAmount: CurrencyAmount;
  exchangeRate: number;
  timestamp: Date;
  provider: string;
}

export class CurrencyService {
  private static instance: CurrencyService;
  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private lastUpdate: Date = new Date(0);
  private updateInterval = 60 * 60 * 1000; // 1 hour

  private constructor() {}

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  async convert(amount: number, fromCurrency: string, toCurrency: string): Promise<ConversionResult> {
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: { amount, currency: fromCurrency },
        convertedAmount: { amount, currency: toCurrency },
        exchangeRate: 1,
        timestamp: new Date(),
        provider: 'same_currency'
      };
    }

    // Update rates if needed
    await this.updateRatesIfNeeded();

    // Get exchange rate
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

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate> {
    const key = `${fromCurrency}_${toCurrency}`;
    const reverseKey = `${toCurrency}_${fromCurrency}`;

    // Check if we have the rate
    if (this.exchangeRates.has(key)) {
      return this.exchangeRates.get(key)!;
    }

    // Check if we have the reverse rate
    if (this.exchangeRates.has(reverseKey)) {
      const reverseRate = this.exchangeRates.get(reverseKey)!;
      const rate: ExchangeRate = {
        baseCurrency: fromCurrency,
        targetCurrency: toCurrency,
        rate: 1 / reverseRate.rate,
        timestamp: reverseRate.timestamp,
        provider: reverseRate.provider
      };
      this.exchangeRates.set(key, rate);
      return rate;
    }

    // Fetch new rate
    const rate = await this.fetchExchangeRate(fromCurrency, toCurrency);
    this.exchangeRates.set(key, rate);
    return rate;
  }

  private async updateRatesIfNeeded(): Promise<void> {
    const now = new Date();
    if (now.getTime() - this.lastUpdate.getTime() > this.updateInterval) {
      await this.updateAllRates();
      this.lastUpdate = now;
    }
  }

  private async fetchExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate> {
    try {
      // Try multiple providers for redundancy
      const providers = [
        () => this.fetchFromExchangeRatesAPI(fromCurrency, toCurrency),
        () => this.fetchFromCurrencyAPI(fromCurrency, toCurrency),
        () => this.fetchFromOpenExchangeRates(fromCurrency, toCurrency),
      ];

      for (const provider of providers) {
        try {
          const rate = await provider();
          if (rate) return rate;
        } catch (error) {
          console.warn('Currency provider failed:', error);
        }
      }

      throw new Error('All currency providers failed');
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      // Return a default rate with low confidence
      return {
        baseCurrency: fromCurrency,
        targetCurrency: toCurrency,
        rate: 1,
        timestamp: new Date(),
        provider: 'fallback'
      };
    }
  }

  private async fetchFromExchangeRatesAPI(fromCurrency: string, toCurrency: string): Promise<ExchangeRate> {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const data = await response.json();
    
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

  private async fetchFromCurrencyAPI(fromCurrency: string, toCurrency: string): Promise<ExchangeRate> {
    const response = await fetch(`https://api.currencyapi.com/v3/latest?apikey=${import.meta.env.CURRENCY_API_KEY}&currencies=${toCurrency}&base_currency=${fromCurrency}`);
    const data = await response.json();
    
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

  private async fetchFromOpenExchangeRates(fromCurrency: string, toCurrency: string): Promise<ExchangeRate> {
    const response = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${import.meta.env.OPENEXCHANGE_API_KEY}`);
    const data = await response.json();
    
    if (!data.rates || !data.rates[toCurrency] || !data.rates[fromCurrency]) {
      throw new Error(`Rate not found for ${fromCurrency} to ${toCurrency}`);
    }

    // Convert via USD
    const rate = data.rates[toCurrency] / data.rates[fromCurrency];

    return {
      baseCurrency: fromCurrency,
      targetCurrency: toCurrency,
      rate: rate,
      timestamp: new Date(data.timestamp * 1000),
      provider: 'openexchangerates'
    };
  }

  private async updateAllRates(): Promise<void> {
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

  formatAmount(amount: number, currency: string, locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  getSupportedCurrencies(): string[] {
    return [
      'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'KRW',
      'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'RUB', 'BRL',
      'MXN', 'ZAR', 'TRY', 'NZD', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'AED'
    ];
  }

  getCurrencyName(currencyCode: string): string {
    const currencyNames: { [key: string]: string } = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound',
      'JPY': 'Japanese Yen',
      'CAD': 'Canadian Dollar',
      'AUD': 'Australian Dollar',
      'CHF': 'Swiss Franc',
      'CNY': 'Chinese Yuan',
      'INR': 'Indian Rupee',
      'KRW': 'South Korean Won',
      'SGD': 'Singapore Dollar',
      'HKD': 'Hong Kong Dollar',
      'NOK': 'Norwegian Krone',
      'SEK': 'Swedish Krona',
      'DKK': 'Danish Krone',
      'PLN': 'Polish Zloty',
      'CZK': 'Czech Koruna',
      'HUF': 'Hungarian Forint',
      'RUB': 'Russian Ruble',
      'BRL': 'Brazilian Real',
      'MXN': 'Mexican Peso',
      'ZAR': 'South African Rand',
      'TRY': 'Turkish Lira',
      'NZD': 'New Zealand Dollar',
      'THB': 'Thai Baht',
      'MYR': 'Malaysian Ringgit',
      'IDR': 'Indonesian Rupiah',
      'PHP': 'Philippine Peso',
      'VND': 'Vietnamese Dong',
      'AED': 'UAE Dirham'
    };
    
    return currencyNames[currencyCode] || currencyCode;
  }

  getCurrencySymbol(currencyCode: string): string {
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'Fr',
      'CNY': '¥',
      'INR': '₹',
      'KRW': '₩',
      'SGD': 'S$',
      'HKD': 'HK$',
      'NOK': 'kr',
      'SEK': 'kr',
      'DKK': 'kr',
      'PLN': 'zł',
      'CZK': 'Kč',
      'HUF': 'Ft',
      'RUB': '₽',
      'BRL': 'R$',
      'MXN': '$',
      'ZAR': 'R',
      'TRY': '₺',
      'NZD': 'NZ$',
      'THB': '฿',
      'MYR': 'RM',
      'IDR': 'Rp',
      'PHP': '₱',
      'VND': '₫',
      'AED': 'د.إ'
    };
    
    return currencySymbols[currencyCode] || currencyCode;
  }

  async convertToBaseCurrency(amount: number, currency: string, baseCurrency: string): Promise<number> {
    if (currency === baseCurrency) {
      return amount;
    }

    const conversion = await this.convert(amount, currency, baseCurrency);
    return conversion.convertedAmount.amount;
  }

  async getHistoricalRate(fromCurrency: string, toCurrency: string, date: Date): Promise<ExchangeRate> {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const response = await fetch(`https://api.exchangerate-api.com/v4/history/${fromCurrency}/${formattedDate}`);
      const data = await response.json();
      
      if (!data.rates || !data.rates[toCurrency]) {
        throw new Error(`Historical rate not found for ${fromCurrency} to ${toCurrency}`);
      }

      return {
        baseCurrency: fromCurrency,
        targetCurrency: toCurrency,
        rate: data.rates[toCurrency],
        timestamp: new Date(data.date),
        provider: 'exchangerate-api-historical'
      };
    } catch (error) {
      console.error('Failed to fetch historical rate:', error);
      // Fallback to current rate
      return await this.getExchangeRate(fromCurrency, toCurrency);
    }
  }

  clearCache(): void {
    this.exchangeRates.clear();
    this.lastUpdate = new Date(0);
  }
}