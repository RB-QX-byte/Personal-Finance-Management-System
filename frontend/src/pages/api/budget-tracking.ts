import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

interface BudgetTracking {
  budget_id: string;
  budget_name: string;
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  budgeted_amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  period: string;
  start_date: string;
  end_date: string | null;
  is_over_budget: boolean;
  status: 'under_budget' | 'on_track' | 'over_budget';
}

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    
    if (!accessToken) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(request.url);
    const budgetId = url.searchParams.get('budget_id');
    const categoryId = url.searchParams.get('category_id');
    const period = url.searchParams.get('period');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    // Base query for budgets
    let budgetQuery = supabase
      .from('budgets')
      .select(`
        id,
        name,
        amount,
        period,
        start_date,
        end_date,
        categories(id, name, color, icon)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Apply filters
    if (budgetId) {
      budgetQuery = budgetQuery.eq('id', budgetId);
    }

    if (categoryId) {
      budgetQuery = budgetQuery.eq('category_id', categoryId);
    }

    if (period) {
      budgetQuery = budgetQuery.eq('period', period);
    }

    if (startDate) {
      budgetQuery = budgetQuery.gte('start_date', startDate);
    }

    if (endDate) {
      budgetQuery = budgetQuery.lte('end_date', endDate);
    }

    const { data: budgets, error: budgetError } = await budgetQuery;

    if (budgetError) {
      console.error('Error fetching budgets:', budgetError);
      return new Response('Internal Server Error', { status: 500 });
    }

    if (!budgets || budgets.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Calculate spending for each budget
    const budgetTrackingData: BudgetTracking[] = await Promise.all(
      budgets.map(async (budget) => {
        const budgetStartDate = budget.start_date;
        const budgetEndDate = budget.end_date || new Date().toISOString().split('T')[0];

        // Query transactions for this budget's category and date range
        const { data: transactions, error: transactionError } = await supabase
          .from('transactions')
          .select('amount, transaction_type')
          .eq('user_id', user.id)
          .eq('category_id', budget.categories?.id)
          .gte('transaction_date', budgetStartDate)
          .lte('transaction_date', budgetEndDate)
          .eq('transaction_type', 'expense'); // Only count expenses for budget tracking

        if (transactionError) {
          console.error('Error fetching transactions for budget:', transactionError);
          throw new Error('Failed to calculate budget spending');
        }

        // Calculate total spending
        const spentAmount = transactions?.reduce((total, transaction) => {
          return total + Math.abs(parseFloat(transaction.amount.toString()));
        }, 0) || 0;

        const budgetedAmount = parseFloat(budget.amount.toString());
        const remainingAmount = budgetedAmount - spentAmount;
        const percentageUsed = budgetedAmount > 0 ? (spentAmount / budgetedAmount) * 100 : 0;
        const isOverBudget = spentAmount > budgetedAmount;

        // Determine status
        let status: 'under_budget' | 'on_track' | 'over_budget';
        if (isOverBudget) {
          status = 'over_budget';
        } else if (percentageUsed >= 80) {
          status = 'on_track';
        } else {
          status = 'under_budget';
        }

        return {
          budget_id: budget.id,
          budget_name: budget.name,
          category_id: budget.categories?.id || '',
          category_name: budget.categories?.name || '',
          category_color: budget.categories?.color || '#6366f1',
          category_icon: budget.categories?.icon || '',
          budgeted_amount: budgetedAmount,
          spent_amount: spentAmount,
          remaining_amount: remainingAmount,
          percentage_used: Math.round(percentageUsed * 100) / 100,
          period: budget.period,
          start_date: budget.start_date,
          end_date: budget.end_date,
          is_over_budget: isOverBudget,
          status,
        };
      })
    );

    return new Response(JSON.stringify(budgetTrackingData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/budget-tracking:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

// POST endpoint for recalculating budget data (useful for manual refresh)
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    
    if (!accessToken) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { budget_id } = body;

    if (!budget_id) {
      return new Response('Budget ID is required', { status: 400 });
    }

    // Get specific budget
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .select(`
        id,
        name,
        amount,
        period,
        start_date,
        end_date,
        categories(id, name, color, icon)
      `)
      .eq('id', budget_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (budgetError || !budget) {
      return new Response('Budget not found', { status: 404 });
    }

    const budgetStartDate = budget.start_date;
    const budgetEndDate = budget.end_date || new Date().toISOString().split('T')[0];

    // Query transactions for this budget's category and date range
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('amount, transaction_type')
      .eq('user_id', user.id)
      .eq('category_id', budget.categories?.id)
      .gte('transaction_date', budgetStartDate)
      .lte('transaction_date', budgetEndDate)
      .eq('transaction_type', 'expense');

    if (transactionError) {
      console.error('Error fetching transactions for budget:', transactionError);
      return new Response('Internal Server Error', { status: 500 });
    }

    // Calculate total spending
    const spentAmount = transactions?.reduce((total, transaction) => {
      return total + Math.abs(parseFloat(transaction.amount.toString()));
    }, 0) || 0;

    const budgetedAmount = parseFloat(budget.amount.toString());
    const remainingAmount = budgetedAmount - spentAmount;
    const percentageUsed = budgetedAmount > 0 ? (spentAmount / budgetedAmount) * 100 : 0;
    const isOverBudget = spentAmount > budgetedAmount;

    // Determine status
    let status: 'under_budget' | 'on_track' | 'over_budget';
    if (isOverBudget) {
      status = 'over_budget';
    } else if (percentageUsed >= 80) {
      status = 'on_track';
    } else {
      status = 'under_budget';
    }

    const budgetTracking: BudgetTracking = {
      budget_id: budget.id,
      budget_name: budget.name,
      category_id: budget.categories?.id || '',
      category_name: budget.categories?.name || '',
      category_color: budget.categories?.color || '#6366f1',
      category_icon: budget.categories?.icon || '',
      budgeted_amount: budgetedAmount,
      spent_amount: spentAmount,
      remaining_amount: remainingAmount,
      percentage_used: Math.round(percentageUsed * 100) / 100,
      period: budget.period,
      start_date: budget.start_date,
      end_date: budget.end_date,
      is_over_budget: isOverBudget,
      status,
    };

    return new Response(JSON.stringify(budgetTracking), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/budget-tracking:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};