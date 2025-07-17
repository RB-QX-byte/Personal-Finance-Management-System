import type { APIRoute } from 'astro';
import { CurrencyService } from '../../../lib/currencyService';

export const GET: APIRoute = async ({ url }) => {
  try {
    const baseCurrency = url.searchParams.get('base') || 'USD';
    const targetCurrencies = url.searchParams.get('targets')?.split(',') || [];
    
    const currencyService = CurrencyService.getInstance();
    const rates: any = {};
    
    if (targetCurrencies.length === 0) {
      // Return all supported currencies
      const supportedCurrencies = currencyService.getSupportedCurrencies();
      
      for (const currency of supportedCurrencies) {
        if (currency !== baseCurrency) {
          try {
            const rate = await currencyService.getExchangeRate(baseCurrency, currency);
            rates[currency] = {
              rate: rate.rate,
              timestamp: rate.timestamp,
              provider: rate.provider
            };
          } catch (error) {
            console.warn(`Failed to get rate for ${baseCurrency} to ${currency}:`, error);
          }
        }
      }
    } else {
      // Return specific currencies
      for (const currency of targetCurrencies) {
        if (currency !== baseCurrency) {
          try {
            const rate = await currencyService.getExchangeRate(baseCurrency, currency);
            rates[currency] = {
              rate: rate.rate,
              timestamp: rate.timestamp,
              provider: rate.provider
            };
          } catch (error) {
            console.warn(`Failed to get rate for ${baseCurrency} to ${currency}:`, error);
          }
        }
      }
    }

    const result = {
      baseCurrency,
      rates,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300'
      },
    });

  } catch (error) {
    console.error('Currency rates error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch currency rates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { baseCurrency, targetCurrencies } = await request.json();
    
    if (!baseCurrency || !targetCurrencies || !Array.isArray(targetCurrencies)) {
      return new Response(JSON.stringify({ 
        error: 'baseCurrency and targetCurrencies array are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const currencyService = CurrencyService.getInstance();
    const rates: any = {};
    
    for (const currency of targetCurrencies) {
      if (currency !== baseCurrency) {
        try {
          const rate = await currencyService.getExchangeRate(baseCurrency, currency);
          rates[currency] = {
            rate: rate.rate,
            timestamp: rate.timestamp,
            provider: rate.provider
          };
        } catch (error) {
          console.warn(`Failed to get rate for ${baseCurrency} to ${currency}:`, error);
        }
      }
    }

    const result = {
      baseCurrency,
      rates,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300'
      },
    });

  } catch (error) {
    console.error('Currency rates error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch currency rates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};