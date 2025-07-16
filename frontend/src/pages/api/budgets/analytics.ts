import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

interface BudgetAnalytics {
  overview: {
    total_active_budgets: number;
    total_budgeted_amount: number;
    total_spent_amount: number;
    total_remaining_amount: number;
    overall_utilization_percentage: number;
    average_budget_performance: number;
  };
  by_period: {
    period: string;
    budget_count: number;
    total_budgeted: number;
    total_spent: number;
    average_utilization: number;
  }[];
  by_category: {
    category_name: string;
    category_color: string;
    budget_count: number;
    total_budgeted: number;
    total_spent: number;
    utilization_percentage: number;
    status: 'under_budget' | 'on_track' | 'over_budget';
  }[];
  trends: {
    month: string;
    budgets_created: number;
    total_budgeted: number;
    total_spent: number;
    utilization_rate: number;
  }[];
  alerts: {
    type: 'over_budget' | 'approaching_limit' | 'unused_budget';
    budget_id: string;
    budget_name: string;
    category_name: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }[];
}

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    const session = await requireAuth(accessToken, refreshToken);

    const url = new URL(request.url);
    const months = parseInt(url.searchParams.get('months') || '6');
    const includeInactive = url.searchParams.get('include_inactive') === 'true';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months);

    // Fetch active budgets with categories
    let budgetQuery = supabase
      .from('budgets')
      .select(`
        id,
        name,
        amount,
        period,
        start_date,
        end_date,
        created_at,
        is_active,
        categories(id, name, color, icon)
      `)
      .eq('user_id', session.user.id)
      .gte('created_at', startDate.toISOString());

    if (!includeInactive) {
      budgetQuery = budgetQuery.eq('is_active', true);
    }

    const { data: budgets, error: budgetError } = await budgetQuery;

    if (budgetError) {
      console.error('Error fetching budgets:', budgetError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch budget analytics' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!budgets || budgets.length === 0) {
      const emptyAnalytics: BudgetAnalytics = {
        overview: {
          total_active_budgets: 0,
          total_budgeted_amount: 0,
          total_spent_amount: 0,
          total_remaining_amount: 0,
          overall_utilization_percentage: 0,
          average_budget_performance: 0,
        },
        by_period: [],
        by_category: [],
        trends: [],
        alerts: [],
      };

      return new Response(JSON.stringify(emptyAnalytics), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Calculate spending for each budget
    const budgetCalculations = await Promise.all(
      budgets.map(async (budget) => {
        const budgetStartDate = budget.start_date;
        const budgetEndDate = budget.end_date || new Date().toISOString().split('T')[0];

        // Query transactions for this budget's category and date range
        const { data: transactions, error: transactionError } = await supabase
          .from('transactions')
          .select('amount, transaction_date')
          .eq('user_id', session.user.id)
          .eq('category_id', budget.categories?.id)
          .gte('transaction_date', budgetStartDate)
          .lte('transaction_date', budgetEndDate)
          .eq('transaction_type', 'expense');

        if (transactionError) {
          console.error('Error fetching transactions for budget:', transactionError);
          return {
            budget,
            spent_amount: 0,
            utilization_percentage: 0,
            transactions_count: 0,
          };
        }

        const spentAmount = transactions?.reduce((total, transaction) => {
          return total + Math.abs(parseFloat(transaction.amount.toString()));
        }, 0) || 0;

        const budgetAmount = parseFloat(budget.amount.toString());
        const utilizationPercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

        return {
          budget,
          spent_amount: spentAmount,
          utilization_percentage: utilizationPercentage,
          transactions_count: transactions?.length || 0,
        };
      })
    );

    // Calculate overview
    const activeBudgets = budgetCalculations.filter(calc => calc.budget.is_active);
    const totalBudgetedAmount = activeBudgets.reduce((sum, calc) => 
      sum + parseFloat(calc.budget.amount.toString()), 0);
    const totalSpentAmount = activeBudgets.reduce((sum, calc) => 
      sum + calc.spent_amount, 0);
    const totalRemainingAmount = totalBudgetedAmount - totalSpentAmount;
    const overallUtilizationPercentage = totalBudgetedAmount > 0 
      ? (totalSpentAmount / totalBudgetedAmount) * 100 
      : 0;
    const averageBudgetPerformance = activeBudgets.length > 0
      ? activeBudgets.reduce((sum, calc) => sum + calc.utilization_percentage, 0) / activeBudgets.length
      : 0;

    // Group by period
    const periodGroups = budgetCalculations.reduce((groups, calc) => {
      const period = calc.budget.period;
      if (!groups[period]) {
        groups[period] = [];
      }
      groups[period].push(calc);
      return groups;
    }, {} as Record<string, typeof budgetCalculations>);

    const byPeriod = Object.entries(periodGroups).map(([period, calcs]) => ({
      period,
      budget_count: calcs.length,
      total_budgeted: calcs.reduce((sum, calc) => sum + parseFloat(calc.budget.amount.toString()), 0),
      total_spent: calcs.reduce((sum, calc) => sum + calc.spent_amount, 0),
      average_utilization: calcs.length > 0 
        ? calcs.reduce((sum, calc) => sum + calc.utilization_percentage, 0) / calcs.length 
        : 0,
    }));

    // Group by category
    const categoryGroups = budgetCalculations.reduce((groups, calc) => {
      const categoryName = calc.budget.categories?.name || 'Unknown';
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(calc);
      return groups;
    }, {} as Record<string, typeof budgetCalculations>);

    const byCategory = Object.entries(categoryGroups).map(([categoryName, calcs]) => {
      const totalBudgeted = calcs.reduce((sum, calc) => sum + parseFloat(calc.budget.amount.toString()), 0);
      const totalSpent = calcs.reduce((sum, calc) => sum + calc.spent_amount, 0);
      const utilizationPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
      
      let status: 'under_budget' | 'on_track' | 'over_budget';
      if (utilizationPercentage > 100) {
        status = 'over_budget';
      } else if (utilizationPercentage >= 80) {
        status = 'on_track';
      } else {
        status = 'under_budget';
      }

      return {
        category_name: categoryName,
        category_color: calcs[0]?.budget.categories?.color || '#6366f1',
        budget_count: calcs.length,
        total_budgeted: Math.round(totalBudgeted * 100) / 100,
        total_spent: Math.round(totalSpent * 100) / 100,
        utilization_percentage: Math.round(utilizationPercentage * 100) / 100,
        status,
      };
    });

    // Calculate trends (monthly data)
    const monthlyTrends = new Map();
    budgetCalculations.forEach(calc => {
      const month = calc.budget.created_at.substring(0, 7); // YYYY-MM format
      if (!monthlyTrends.has(month)) {
        monthlyTrends.set(month, {
          budgets_created: 0,
          total_budgeted: 0,
          total_spent: 0,
        });
      }
      const trend = monthlyTrends.get(month);
      trend.budgets_created += 1;
      trend.total_budgeted += parseFloat(calc.budget.amount.toString());
      trend.total_spent += calc.spent_amount;
    });

    const trends = Array.from(monthlyTrends.entries())
      .map(([month, data]) => ({
        month,
        budgets_created: data.budgets_created,
        total_budgeted: Math.round(data.total_budgeted * 100) / 100,
        total_spent: Math.round(data.total_spent * 100) / 100,
        utilization_rate: data.total_budgeted > 0 
          ? Math.round((data.total_spent / data.total_budgeted) * 10000) / 100
          : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Generate alerts
    const alerts = [];
    budgetCalculations.forEach(calc => {
      if (!calc.budget.is_active) return;

      const utilizationPercentage = calc.utilization_percentage;
      const budgetName = calc.budget.name;
      const categoryName = calc.budget.categories?.name || 'Unknown';

      // Over budget alert
      if (utilizationPercentage > 100) {
        alerts.push({
          type: 'over_budget' as const,
          budget_id: calc.budget.id,
          budget_name: budgetName,
          category_name: categoryName,
          message: `Budget exceeded by ${Math.round((utilizationPercentage - 100) * 100) / 100}%`,
          severity: 'high' as const,
        });
      }
      // Approaching limit alert
      else if (utilizationPercentage >= 80) {
        alerts.push({
          type: 'approaching_limit' as const,
          budget_id: calc.budget.id,
          budget_name: budgetName,
          category_name: categoryName,
          message: `${Math.round(utilizationPercentage * 100) / 100}% of budget used`,
          severity: utilizationPercentage >= 90 ? 'medium' as const : 'low' as const,
        });
      }
      // Unused budget alert
      else if (utilizationPercentage < 20 && calc.transactions_count === 0) {
        alerts.push({
          type: 'unused_budget' as const,
          budget_id: calc.budget.id,
          budget_name: budgetName,
          category_name: categoryName,
          message: `Budget appears unused - only ${Math.round(utilizationPercentage * 100) / 100}% used`,
          severity: 'low' as const,
        });
      }
    });

    const analytics: BudgetAnalytics = {
      overview: {
        total_active_budgets: activeBudgets.length,
        total_budgeted_amount: Math.round(totalBudgetedAmount * 100) / 100,
        total_spent_amount: Math.round(totalSpentAmount * 100) / 100,
        total_remaining_amount: Math.round(totalRemainingAmount * 100) / 100,
        overall_utilization_percentage: Math.round(overallUtilizationPercentage * 100) / 100,
        average_budget_performance: Math.round(averageBudgetPerformance * 100) / 100,
      },
      by_period: byPeriod,
      by_category: byCategory,
      trends,
      alerts,
    };

    return new Response(JSON.stringify(analytics), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/budgets/analytics:', error);
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