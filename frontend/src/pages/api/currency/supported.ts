import type { APIRoute } from 'astro';
import { CurrencyService } from '../../../lib/currencyService';

export const GET: APIRoute = async () => {
  try {
    const currencyService = CurrencyService.getInstance();
    const supportedCurrencies = currencyService.getSupportedCurrencies();
    
    const currencies = supportedCurrencies.map(code => ({
      code,
      name: currencyService.getCurrencyName(code),
      symbol: currencyService.getCurrencySymbol(code)
    }));

    return new Response(JSON.stringify({ currencies }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=3600' // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Supported currencies error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch supported currencies',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};