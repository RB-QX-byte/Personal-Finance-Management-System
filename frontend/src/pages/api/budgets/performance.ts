import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

interface BudgetPerformance {
  budget_id: string;
  budget_name: string;
  category_name: string;
  period: string;
  start_date: string;
  end_date: string | null;
  budgeted_amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  days_elapsed: number;
  days_total: number;
  daily_average_spending: number;
  projected_spending: number;
  variance: number;
  status: 'under_budget' | 'on_track' | 'over_budget' | 'warning';
  recommendations: string[];
}

interface BudgetSummary {
  total_budgets: number;
  total_budgeted: number;
  total_spent: number;
  total_remaining: number;
  overall_percentage_used: number;
  budgets_on_track: number;
  budgets_over_budget: number;
  budgets_under_budget: number;
  average_performance: number;
}

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    const session = await requireAuth(accessToken, refreshToken);

    const url = new URL(request.url);
    const period = url.searchParams.get('period');
    const categoryId = url.searchParams.get('category_id');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    // Fetch active budgets
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
      .eq('user_id', session.user.id)
      .eq('is_active', true);

    // Apply filters
    if (period) {
      budgetQuery = budgetQuery.eq('period', period);
    }

    if (categoryId) {
      budgetQuery = budgetQuery.eq('category_id', categoryId);
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
      return new Response(
        JSON.stringify({ error: 'Failed to fetch budgets' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!budgets || budgets.length === 0) {
      return new Response(JSON.stringify({
        performance: [],
        summary: {
          total_budgets: 0,
          total_budgeted: 0,
          total_spent: 0,
          total_remaining: 0,
          overall_percentage_used: 0,
          budgets_on_track: 0,
          budgets_over_budget: 0,
          budgets_under_budget: 0,
          average_performance: 0,
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Calculate performance for each budget
    const performanceData: BudgetPerformance[] = await Promise.all(
      budgets.map(async (budget) => {
        const budgetStartDate = new Date(budget.start_date);
        const budgetEndDate = budget.end_date ? new Date(budget.end_date) : new Date();
        const currentDate = new Date();
        
        // Calculate days
        const daysTotal = Math.ceil((budgetEndDate.getTime() - budgetStartDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysElapsed = Math.min(
          Math.ceil((currentDate.getTime() - budgetStartDate.getTime()) / (1000 * 60 * 60 * 24)),
          daysTotal
        );

        // Query transactions for this budget's category and date range
        const { data: transactions, error: transactionError } = await supabase
          .from('transactions')
          .select('amount, transaction_date')
          .eq('user_id', session.user.id)
          .eq('category_id', budget.categories?.id)
          .gte('transaction_date', budget.start_date)
          .lte('transaction_date', budget.end_date || new Date().toISOString().split('T')[0])
          .eq('transaction_type', 'expense');

        if (transactionError) {
          console.error('Error fetching transactions for budget:', transactionError);
          throw new Error('Failed to calculate budget performance');
        }

        // Calculate spending metrics
        const spentAmount = transactions?.reduce((total, transaction) => {
          return total + Math.abs(parseFloat(transaction.amount.toString()));
        }, 0) || 0;

        const budgetedAmount = parseFloat(budget.amount.toString());
        const remainingAmount = budgetedAmount - spentAmount;
        const percentageUsed = budgetedAmount > 0 ? (spentAmount / budgetedAmount) * 100 : 0;
        
        // Calculate daily averages and projections
        const dailyAverageSpending = daysElapsed > 0 ? spentAmount / daysElapsed : 0;
        const projectedSpending = dailyAverageSpending * daysTotal;
        const variance = projectedSpending - budgetedAmount;

        // Determine status and generate recommendations
        let status: 'under_budget' | 'on_track' | 'over_budget' | 'warning';
        const recommendations: string[] = [];

        if (spentAmount > budgetedAmount) {
          status = 'over_budget';
          recommendations.push('You have exceeded your budget. Consider reviewing your spending habits.');
          recommendations.push('Look for areas where you can cut back on expenses.');
        } else if (projectedSpending > budgetedAmount * 1.1) {
          status = 'warning';
          recommendations.push('Your current spending pace may lead to exceeding the budget.');
          recommendations.push('Consider reducing spending to stay on track.');
        } else if (percentageUsed >= 80) {
          status = 'on_track';
          recommendations.push('You are on track with your budget.');
          if (daysElapsed / daysTotal < 0.8) {
            recommendations.push('Continue monitoring your spending closely.');
          }
        } else {
          status = 'under_budget';
          recommendations.push('You are doing well with your budget.');
          if (dailyAverageSpending < (budgetedAmount / daysTotal) * 0.5) {
            recommendations.push('You have room to spend more if needed.');
          }
        }

        // Add period-specific recommendations
        if (budget.period === 'monthly' && daysElapsed > 20) {
          recommendations.push('End of month approaching - review remaining budget allocation.');
        } else if (budget.period === 'weekly' && daysElapsed > 5) {
          recommendations.push('End of week approaching - consider weekend spending plans.');
        }

        return {
          budget_id: budget.id,
          budget_name: budget.name,
          category_name: budget.categories?.name || '',
          period: budget.period,
          start_date: budget.start_date,
          end_date: budget.end_date,
          budgeted_amount: budgetedAmount,
          spent_amount: spentAmount,
          remaining_amount: remainingAmount,
          percentage_used: Math.round(percentageUsed * 100) / 100,
          days_elapsed: daysElapsed,
          days_total: daysTotal,
          daily_average_spending: Math.round(dailyAverageSpending * 100) / 100,
          projected_spending: Math.round(projectedSpending * 100) / 100,
          variance: Math.round(variance * 100) / 100,
          status,
          recommendations,
        };
      })
    );

    // Calculate summary statistics
    const summary: BudgetSummary = {
      total_budgets: performanceData.length,
      total_budgeted: performanceData.reduce((sum, p) => sum + p.budgeted_amount, 0),
      total_spent: performanceData.reduce((sum, p) => sum + p.spent_amount, 0),
      total_remaining: performanceData.reduce((sum, p) => sum + p.remaining_amount, 0),
      overall_percentage_used: 0,
      budgets_on_track: performanceData.filter(p => p.status === 'on_track').length,
      budgets_over_budget: performanceData.filter(p => p.status === 'over_budget').length,
      budgets_under_budget: performanceData.filter(p => p.status === 'under_budget').length,
      average_performance: 0,
    };

    // Calculate overall percentage and average performance
    if (summary.total_budgeted > 0) {
      summary.overall_percentage_used = Math.round((summary.total_spent / summary.total_budgeted) * 10000) / 100;
    }

    if (performanceData.length > 0) {
      summary.average_performance = Math.round(
        (performanceData.reduce((sum, p) => sum + p.percentage_used, 0) / performanceData.length) * 100
      ) / 100;
    }

    return new Response(JSON.stringify({
      performance: performanceData,
      summary,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/budgets/performance:', error);
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