import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Fetch transactions for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        *,
        categories (name, color),
        accounts (name, account_type)
      `)
      .eq('user_id', userId)
      .gte('transaction_date', twelveMonthsAgo.toISOString().split('T')[0])
      .order('transaction_date', { ascending: true });

    if (transactionsError) {
      return new Response(JSON.stringify({ error: transactionsError.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Fetch budgets
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (budgetsError) {
      return new Response(JSON.stringify({ error: budgetsError.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Process spending trends data
    const spendingTrends = processSpendingTrends(transactions || []);
    
    // Process category spending data
    const categorySpending = processCategorySpending(transactions || []);
    
    // Process budget vs actual data
    const budgetVsActual = processBudgetVsActual(transactions || [], budgets || []);
    
    // Process income vs expenses data
    const incomeVsExpenses = processIncomeVsExpenses(transactions || []);
    
    // Process net worth data
    const netWorth = processNetWorth(transactions || []);

    const dashboardData = {
      spendingTrends,
      categorySpending,
      budgetVsActual,
      incomeVsExpenses,
      netWorth,
      lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify(dashboardData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300' // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Dashboard data API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

function processSpendingTrends(transactions: any[]) {
  const monthlySpending = new Map();
  
  transactions.forEach(transaction => {
    if (transaction.transaction_type === 'expense') {
      const month = transaction.transaction_date.substring(0, 7); // YYYY-MM
      const current = monthlySpending.get(month) || 0;
      monthlySpending.set(month, current + Math.abs(transaction.amount));
    }
  });

  const labels = Array.from(monthlySpending.keys()).sort();
  const data = labels.map(month => monthlySpending.get(month));

  return { labels, data };
}

function processCategorySpending(transactions: any[]) {
  const categorySpending = new Map();
  
  transactions.forEach(transaction => {
    if (transaction.transaction_type === 'expense') {
      const categoryName = transaction.categories?.name || 'Uncategorized';
      const current = categorySpending.get(categoryName) || 0;
      categorySpending.set(categoryName, current + Math.abs(transaction.amount));
    }
  });

  const labels = Array.from(categorySpending.keys());
  const data = labels.map(category => categorySpending.get(category));

  return { labels, data };
}

function processBudgetVsActual(transactions: any[], budgets: any[]) {
  const categorySpending = new Map();
  
  // Calculate actual spending by category
  transactions.forEach(transaction => {
    if (transaction.transaction_type === 'expense') {
      const categoryId = transaction.category_id;
      const current = categorySpending.get(categoryId) || 0;
      categorySpending.set(categoryId, current + Math.abs(transaction.amount));
    }
  });

  // Match with budgets
  const labels: string[] = [];
  const budgetData: number[] = [];
  const actualData: number[] = [];

  budgets.forEach(budget => {
    labels.push(budget.name);
    budgetData.push(budget.amount);
    actualData.push(categorySpending.get(budget.category_id) || 0);
  });

  return { labels, budgetData, actualData };
}

function processIncomeVsExpenses(transactions: any[]) {
  const monthlyData = new Map();
  
  transactions.forEach(transaction => {
    const month = transaction.transaction_date.substring(0, 7);
    if (!monthlyData.has(month)) {
      monthlyData.set(month, { income: 0, expenses: 0 });
    }
    
    const data = monthlyData.get(month);
    if (transaction.transaction_type === 'income') {
      data.income += transaction.amount;
    } else {
      data.expenses += Math.abs(transaction.amount);
    }
  });

  const labels = Array.from(monthlyData.keys()).sort();
  const incomeData = labels.map(month => monthlyData.get(month).income);
  const expenseData = labels.map(month => monthlyData.get(month).expenses);

  return { labels, incomeData, expenseData };
}

function processNetWorth(transactions: any[]) {
  const monthlyNetWorth = new Map();
  let runningTotal = 0;
  
  transactions.forEach(transaction => {
    const month = transaction.transaction_date.substring(0, 7);
    if (transaction.transaction_type === 'income') {
      runningTotal += transaction.amount;
    } else {
      runningTotal -= Math.abs(transaction.amount);
    }
    monthlyNetWorth.set(month, runningTotal);
  });

  const labels = Array.from(monthlyNetWorth.keys()).sort();
  const data = labels.map(month => monthlyNetWorth.get(month));

  return { labels, data };
}