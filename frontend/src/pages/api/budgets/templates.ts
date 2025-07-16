import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  period: string;
  categories: {
    category_name: string;
    suggested_amount: number;
    percentage_of_income?: number;
    priority: 'high' | 'medium' | 'low';
    description: string;
  }[];
}

const BUDGET_TEMPLATES: BudgetTemplate[] = [
  {
    id: '50-30-20',
    name: '50/30/20 Budget',
    description: 'Allocate 50% for needs, 30% for wants, and 20% for savings and debt repayment',
    period: 'monthly',
    categories: [
      {
        category_name: 'Housing',
        suggested_amount: 0,
        percentage_of_income: 25,
        priority: 'high',
        description: 'Rent, mortgage, utilities, insurance'
      },
      {
        category_name: 'Transportation',
        suggested_amount: 0,
        percentage_of_income: 15,
        priority: 'high',
        description: 'Car payments, gas, maintenance, public transport'
      },
      {
        category_name: 'Food & Groceries',
        suggested_amount: 0,
        percentage_of_income: 10,
        priority: 'high',
        description: 'Groceries and essential food expenses'
      },
      {
        category_name: 'Entertainment',
        suggested_amount: 0,
        percentage_of_income: 15,
        priority: 'medium',
        description: 'Movies, dining out, hobbies'
      },
      {
        category_name: 'Shopping',
        suggested_amount: 0,
        percentage_of_income: 10,
        priority: 'medium',
        description: 'Clothing, personal items, non-essentials'
      },
      {
        category_name: 'Personal Care',
        suggested_amount: 0,
        percentage_of_income: 5,
        priority: 'medium',
        description: 'Health, beauty, fitness'
      },
      {
        category_name: 'Savings',
        suggested_amount: 0,
        percentage_of_income: 15,
        priority: 'high',
        description: 'Emergency fund, investments, retirement'
      },
      {
        category_name: 'Debt Payment',
        suggested_amount: 0,
        percentage_of_income: 5,
        priority: 'high',
        description: 'Credit cards, loans, other debt'
      }
    ]
  },
  {
    id: 'zero-based',
    name: 'Zero-Based Budget',
    description: 'Every dollar is allocated to a specific category, resulting in zero leftover',
    period: 'monthly',
    categories: [
      {
        category_name: 'Housing',
        suggested_amount: 0,
        percentage_of_income: 30,
        priority: 'high',
        description: 'All housing-related expenses'
      },
      {
        category_name: 'Transportation',
        suggested_amount: 0,
        percentage_of_income: 15,
        priority: 'high',
        description: 'Vehicle and commuting costs'
      },
      {
        category_name: 'Food & Groceries',
        suggested_amount: 0,
        percentage_of_income: 12,
        priority: 'high',
        description: 'All food expenses including dining out'
      },
      {
        category_name: 'Utilities',
        suggested_amount: 0,
        percentage_of_income: 8,
        priority: 'high',
        description: 'Electricity, water, internet, phone'
      },
      {
        category_name: 'Insurance',
        suggested_amount: 0,
        percentage_of_income: 5,
        priority: 'high',
        description: 'Health, auto, life insurance'
      },
      {
        category_name: 'Personal Care',
        suggested_amount: 0,
        percentage_of_income: 3,
        priority: 'medium',
        description: 'Healthcare, grooming, fitness'
      },
      {
        category_name: 'Entertainment',
        suggested_amount: 0,
        percentage_of_income: 7,
        priority: 'low',
        description: 'Leisure activities and entertainment'
      },
      {
        category_name: 'Emergency Fund',
        suggested_amount: 0,
        percentage_of_income: 10,
        priority: 'high',
        description: 'Emergency savings fund'
      },
      {
        category_name: 'Investments',
        suggested_amount: 0,
        percentage_of_income: 10,
        priority: 'high',
        description: 'Retirement and investment contributions'
      }
    ]
  },
  {
    id: 'envelope',
    name: 'Envelope Budget',
    description: 'Cash-based budgeting system with specific amounts for each category',
    period: 'monthly',
    categories: [
      {
        category_name: 'Housing',
        suggested_amount: 1200,
        priority: 'high',
        description: 'Fixed housing costs'
      },
      {
        category_name: 'Food & Groceries',
        suggested_amount: 400,
        priority: 'high',
        description: 'Weekly grocery budget'
      },
      {
        category_name: 'Transportation',
        suggested_amount: 300,
        priority: 'high',
        description: 'Gas and car maintenance'
      },
      {
        category_name: 'Entertainment',
        suggested_amount: 200,
        priority: 'medium',
        description: 'Fun money envelope'
      },
      {
        category_name: 'Personal Care',
        suggested_amount: 100,
        priority: 'medium',
        description: 'Health and beauty expenses'
      },
      {
        category_name: 'Clothing',
        suggested_amount: 150,
        priority: 'low',
        description: 'Clothing and accessories'
      },
      {
        category_name: 'Miscellaneous',
        suggested_amount: 100,
        priority: 'low',
        description: 'Unexpected small expenses'
      }
    ]
  },
  {
    id: 'pay-yourself-first',
    name: 'Pay Yourself First',
    description: 'Prioritize savings and investments before other expenses',
    period: 'monthly',
    categories: [
      {
        category_name: 'Emergency Fund',
        suggested_amount: 0,
        percentage_of_income: 20,
        priority: 'high',
        description: 'Build emergency savings first'
      },
      {
        category_name: 'Retirement',
        suggested_amount: 0,
        percentage_of_income: 15,
        priority: 'high',
        description: 'Retirement contributions'
      },
      {
        category_name: 'Investments',
        suggested_amount: 0,
        percentage_of_income: 10,
        priority: 'high',
        description: 'Additional investment accounts'
      },
      {
        category_name: 'Housing',
        suggested_amount: 0,
        percentage_of_income: 25,
        priority: 'high',
        description: 'Remaining for housing'
      },
      {
        category_name: 'Transportation',
        suggested_amount: 0,
        percentage_of_income: 10,
        priority: 'high',
        description: 'Transportation needs'
      },
      {
        category_name: 'Food & Groceries',
        suggested_amount: 0,
        percentage_of_income: 8,
        priority: 'high',
        description: 'Food expenses'
      },
      {
        category_name: 'Everything Else',
        suggested_amount: 0,
        percentage_of_income: 12,
        priority: 'medium',
        description: 'All other expenses'
      }
    ]
  }
];

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    const session = await requireAuth(accessToken, refreshToken);

    const url = new URL(request.url);
    const templateId = url.searchParams.get('template_id');
    const income = url.searchParams.get('monthly_income');

    let templates = BUDGET_TEMPLATES;

    // Filter by template ID if provided
    if (templateId) {
      templates = templates.filter(t => t.id === templateId);
    }

    // Calculate suggested amounts based on income if provided
    if (income && parseFloat(income) > 0) {
      const monthlyIncome = parseFloat(income);
      
      templates = templates.map(template => ({
        ...template,
        categories: template.categories.map(category => ({
          ...category,
          suggested_amount: category.percentage_of_income 
            ? Math.round((monthlyIncome * category.percentage_of_income / 100) * 100) / 100
            : category.suggested_amount
        }))
      }));
    }

    return new Response(JSON.stringify(templates), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/budgets/templates:', error);
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

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    const session = await requireAuth(accessToken, refreshToken);

    const body = await request.json();
    const { template_id, monthly_income, start_date, custom_amounts } = body;

    if (!template_id || !start_date) {
      return new Response(
        JSON.stringify({ error: 'Template ID and start date are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Find the template
    const template = BUDGET_TEMPLATES.find(t => t.id === template_id);
    if (!template) {
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user's categories or create them
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', session.user.id)
      .eq('is_active', true);

    const categoryMap = new Map();
    if (existingCategories) {
      existingCategories.forEach(cat => {
        categoryMap.set(cat.name.toLowerCase(), cat.id);
      });
    }

    // Calculate end date based on period
    const startDateObj = new Date(start_date);
    let endDateObj: Date;
    
    switch (template.period) {
      case 'weekly':
        endDateObj = new Date(startDateObj);
        endDateObj.setDate(startDateObj.getDate() + 7);
        break;
      case 'monthly':
        endDateObj = new Date(startDateObj);
        endDateObj.setMonth(startDateObj.getMonth() + 1);
        break;
      case 'quarterly':
        endDateObj = new Date(startDateObj);
        endDateObj.setMonth(startDateObj.getMonth() + 3);
        break;
      case 'yearly':
        endDateObj = new Date(startDateObj);
        endDateObj.setFullYear(startDateObj.getFullYear() + 1);
        break;
      default:
        endDateObj = new Date(startDateObj);
        endDateObj.setMonth(startDateObj.getMonth() + 1);
    }

    const end_date = endDateObj.toISOString().split('T')[0];

    // Create budgets for each category in the template
    const createdBudgets = [];
    const errors = [];

    for (const templateCategory of template.categories) {
      try {
        // Calculate amount
        let amount = templateCategory.suggested_amount;
        
        // Use custom amount if provided
        if (custom_amounts && custom_amounts[templateCategory.category_name]) {
          amount = parseFloat(custom_amounts[templateCategory.category_name]);
        } 
        // Calculate from income if percentage is provided
        else if (templateCategory.percentage_of_income && monthly_income) {
          amount = (parseFloat(monthly_income) * templateCategory.percentage_of_income) / 100;
        }

        if (amount <= 0) {
          errors.push(`Invalid amount for ${templateCategory.category_name}`);
          continue;
        }

        // Find or create category
        let categoryId = categoryMap.get(templateCategory.category_name.toLowerCase());
        
        if (!categoryId) {
          // Create new category
          const { data: newCategory, error: categoryError } = await supabase
            .from('categories')
            .insert({
              user_id: session.user.id,
              name: templateCategory.category_name,
              color: '#6366f1',
              icon: '',
              is_active: true
            })
            .select('id')
            .single();

          if (categoryError) {
            errors.push(`Failed to create category: ${templateCategory.category_name}`);
            continue;
          }

          categoryId = newCategory.id;
        }

        // Create budget
        const { data: budget, error: budgetError } = await supabase
          .from('budgets')
          .insert({
            user_id: session.user.id,
            category_id: categoryId,
            name: `${templateCategory.category_name} - ${template.name}`,
            amount: Math.round(amount * 100) / 100,
            period: template.period,
            start_date,
            end_date,
            description: templateCategory.description,
            is_active: true
          })
          .select(`
            *,
            categories(name, color, icon)
          `)
          .single();

        if (budgetError) {
          errors.push(`Failed to create budget for ${templateCategory.category_name}: ${budgetError.message}`);
        } else {
          createdBudgets.push(budget);
        }
      } catch (error) {
        errors.push(`Error processing ${templateCategory.category_name}: ${error.message}`);
      }
    }

    const response = {
      success: true,
      template_applied: template.name,
      budgets_created: createdBudgets.length,
      total_budgets: template.categories.length,
      created_budgets: createdBudgets,
      errors: errors.length > 0 ? errors : undefined
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/budgets/templates:', error);
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