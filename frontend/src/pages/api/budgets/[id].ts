import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { requireAuth } from '../../../lib/auth';

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    const session = await requireAuth(accessToken, refreshToken);
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Budget ID is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { data: budget, error } = await supabase
      .from('budgets')
      .select(`
        *,
        categories(id, name, color, icon)
      `)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching budget:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch budget' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!budget) {
      return new Response(
        JSON.stringify({ error: 'Budget not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(JSON.stringify(budget), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/budgets/[id]:', error);
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

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    const session = await requireAuth(accessToken, refreshToken);
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Budget ID is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json();
    const { 
      category_id, 
      name, 
      amount, 
      period, 
      start_date, 
      end_date, 
      description, 
      is_active 
    } = body;

    // Validate period if provided
    if (period) {
      const validPeriods = ['weekly', 'monthly', 'quarterly', 'yearly'];
      if (!validPeriods.includes(period)) {
        return new Response(
          JSON.stringify({ error: 'Invalid period. Must be one of: weekly, monthly, quarterly, yearly' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Validate amount if provided
    if (amount !== undefined && parseFloat(amount) <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be greater than zero' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate dates if provided
    if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
      return new Response(
        JSON.stringify({ error: 'End date must be after start date' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Build update object
    const updateData: any = {};
    if (category_id) updateData.category_id = category_id;
    if (name) updateData.name = name;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (period) updateData.period = period;
    if (start_date) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update budget
    const { data: budget, error } = await supabase
      .from('budgets')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select(`
        *,
        categories(name, color, icon)
      `)
      .single();

    if (error) {
      console.error('Error updating budget:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update budget' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!budget) {
      return new Response(
        JSON.stringify({ error: 'Budget not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(JSON.stringify(budget), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/budgets/[id]:', error);
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

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    const session = await requireAuth(accessToken, refreshToken);
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Budget ID is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Delete budget
    const { data: budget, error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting budget:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to delete budget' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!budget) {
      return new Response(
        JSON.stringify({ error: 'Budget not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(JSON.stringify({ message: 'Budget deleted successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in DELETE /api/budgets/[id]:', error);
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