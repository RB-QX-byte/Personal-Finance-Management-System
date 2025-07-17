import type { APIRoute } from 'astro';
import { CurrencyService } from '../../../lib/currencyService';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { amount, fromCurrency, toCurrency } = await request.json();
    
    if (!amount || !fromCurrency || !toCurrency) {
      return new Response(JSON.stringify({ 
        error: 'Amount, fromCurrency, and toCurrency are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const currencyService = CurrencyService.getInstance();
    const conversion = await currencyService.convert(amount, fromCurrency, toCurrency);

    return new Response(JSON.stringify(conversion), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300' // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Currency conversion error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to convert currency',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const amount = parseFloat(url.searchParams.get('amount') || '0');
    const fromCurrency = url.searchParams.get('from') || '';
    const toCurrency = url.searchParams.get('to') || '';
    
    if (!amount || !fromCurrency || !toCurrency) {
      return new Response(JSON.stringify({ 
        error: 'Amount, from, and to parameters are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const currencyService = CurrencyService.getInstance();
    const conversion = await currencyService.convert(amount, fromCurrency, toCurrency);

    return new Response(JSON.stringify(conversion), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300'
      },
    });

  } catch (error) {
    console.error('Currency conversion error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to convert currency',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};