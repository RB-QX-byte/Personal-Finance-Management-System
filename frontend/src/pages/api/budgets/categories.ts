import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

interface CategoryBudgetSummary {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  total_budgets: number;
  active_budgets: number;
  total_budgeted_amount: number;
  total_spent_amount: number;
  total_remaining_amount: number;
  average_utilization: number;
  periods: string[];
  latest_budget: {
    id: string;
    name: string;
    amount: number;
    period: string;
    start_date: string;
    end_date: string | null;
    status: string;
  } | null;
}

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    const session = await requireAuth(accessToken, refreshToken);

    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('include_inactive') === 'true';
    const period = url.searchParams.get('period');

    // Fetch categories with their budgets
    let categoriesQuery = supabase
      .from('categories')
      .select(`
        id,
        name,
        color,
        icon,
        budgets!inner(
          id,
          name,
          amount,
          period,
          start_date,
          end_date,
          is_active,
          created_at
        )
      `)
      .eq('user_id', session.user.id)
      .eq('is_active', true);

    const { data: categoriesWithBudgets, error: categoriesError } = await categoriesQuery;

    if (categoriesError) {
      console.error('Error fetching categories with budgets:', categoriesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch budget categories' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Process each category
    const categoryData: CategoryBudgetSummary[] = await Promise.all(
      (categoriesWithBudgets || []).map(async (category) => {
        // Filter budgets if needed
        let budgets = category.budgets || [];
        
        if (!includeInactive) {
          budgets = budgets.filter(b => b.is_active);
        }

        if (period) {
          budgets = budgets.filter(b => b.period === period);
        }

        // Calculate spending for each budget
        const budgetCalculations = await Promise.all(
          budgets.map(async (budget) => {
            const budgetStartDate = budget.start_date;
            const budgetEndDate = budget.end_date || new Date().toISOString().split('T')[0];

            // Query transactions for this budget's category and date range
            const { data: transactions, error: transactionError } = await supabase
              .from('transactions')
              .select('amount')
              .eq('user_id', session.user.id)
              .eq('category_id', category.id)
              .gte('transaction_date', budgetStartDate)
              .lte('transaction_date', budgetEndDate)
              .eq('transaction_type', 'expense');

            if (transactionError) {
              console.error('Error fetching transactions for budget:', transactionError);
              return {
                budget,
                spent_amount: 0,
                utilization: 0,
              };
            }

            const spentAmount = transactions?.reduce((total, transaction) => {
              return total + Math.abs(parseFloat(transaction.amount.toString()));
            }, 0) || 0;

            const budgetAmount = parseFloat(budget.amount.toString());
            const utilization = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

            return {
              budget,
              spent_amount: spentAmount,
              utilization,
            };
          })
        );

        // Calculate summary statistics
        const totalBudgetedAmount = budgetCalculations.reduce((sum, calc) => 
          sum + parseFloat(calc.budget.amount.toString()), 0);
        const totalSpentAmount = budgetCalculations.reduce((sum, calc) => 
          sum + calc.spent_amount, 0);
        const totalRemainingAmount = totalBudgetedAmount - totalSpentAmount;
        
        const averageUtilization = budgetCalculations.length > 0 
          ? budgetCalculations.reduce((sum, calc) => sum + calc.utilization, 0) / budgetCalculations.length 
          : 0;

        // Get unique periods
        const periods = [...new Set(budgets.map(b => b.period))];

        // Find latest budget
        const latestBudget = budgets.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        let latestBudgetData = null;
        if (latestBudget) {
          const latestCalc = budgetCalculations.find(calc => calc.budget.id === latestBudget.id);
          let status = 'under_budget';
          
          if (latestCalc) {
            if (latestCalc.spent_amount > parseFloat(latestBudget.amount.toString())) {
              status = 'over_budget';
            } else if (latestCalc.utilization >= 80) {
              status = 'on_track';
            }
          }

          latestBudgetData = {
            id: latestBudget.id,
            name: latestBudget.name,
            amount: parseFloat(latestBudget.amount.toString()),
            period: latestBudget.period,
            start_date: latestBudget.start_date,
            end_date: latestBudget.end_date,
            status,
          };
        }

        return {
          category_id: category.id,
          category_name: category.name,
          category_color: category.color || '#6366f1',
          category_icon: category.icon || '',
          total_budgets: budgets.length,
          active_budgets: budgets.filter(b => b.is_active).length,
          total_budgeted_amount: Math.round(totalBudgetedAmount * 100) / 100,
          total_spent_amount: Math.round(totalSpentAmount * 100) / 100,
          total_remaining_amount: Math.round(totalRemainingAmount * 100) / 100,
          average_utilization: Math.round(averageUtilization * 100) / 100,
          periods,
          latest_budget: latestBudgetData,
        };
      })
    );

    // Filter out categories with no budgets if requested
    const filteredCategoryData = categoryData.filter(cat => cat.total_budgets > 0);

    return new Response(JSON.stringify(filteredCategoryData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/budgets/categories:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};