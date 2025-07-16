import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

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
    const categoryId = url.searchParams.get('category_id');
    const period = url.searchParams.get('period');
    const isActive = url.searchParams.get('is_active');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    let query = supabase
      .from('budgets')
      .select(`
        *,
        categories(name, color, icon)
      `)
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (period) {
      query = query.eq('period', period);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (startDate) {
      query = query.gte('start_date', startDate);
    }

    if (endDate) {
      query = query.lte('end_date', endDate);
    }

    const { data: budgets, error } = await query;

    if (error) {
      console.error('Error fetching budgets:', error);
      return new Response('Internal Server Error', { status: 500 });
    }

    return new Response(JSON.stringify(budgets), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/budgets:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

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
    const { 
      category_id, 
      name, 
      amount, 
      period, 
      start_date, 
      end_date, 
      description 
    } = body;

    // Validate required fields
    if (!category_id || !name || !amount || !period || !start_date) {
      return new Response('Category ID, name, amount, period, and start date are required', { status: 400 });
    }

    // Validate period
    const validPeriods = ['weekly', 'monthly', 'quarterly', 'yearly'];
    if (!validPeriods.includes(period)) {
      return new Response('Invalid period', { status: 400 });
    }

    // Validate amount
    if (parseFloat(amount) <= 0) {
      return new Response('Amount must be greater than zero', { status: 400 });
    }

    // Validate dates
    if (end_date && new Date(end_date) <= new Date(start_date)) {
      return new Response('End date must be after start date', { status: 400 });
    }

    // Verify category belongs to user
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .eq('user_id', user.id)
      .single();

    if (categoryError || !category) {
      return new Response('Category not found', { status: 404 });
    }

    // Insert new budget
    const { data: budget, error } = await supabase
      .from('budgets')
      .insert([
        {
          user_id: user.id,
          category_id,
          name,
          amount: parseFloat(amount),
          period,
          start_date,
          end_date: end_date || null,
          description: description || null,
        },
      ])
      .select(`
        *,
        categories(name, color, icon)
      `)
      .single();

    if (error) {
      console.error('Error creating budget:', error);
      if (error.code === '23505') {
        return new Response('Budget for this category and period already exists', { status: 409 });
      }
      return new Response('Internal Server Error', { status: 500 });
    }

    return new Response(JSON.stringify(budget), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/budgets:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
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
    const { 
      id, 
      category_id, 
      name, 
      amount, 
      period, 
      start_date, 
      end_date, 
      description, 
      is_active 
    } = body;

    if (!id) {
      return new Response('Budget ID is required', { status: 400 });
    }

    // Validate period if provided
    if (period) {
      const validPeriods = ['weekly', 'monthly', 'quarterly', 'yearly'];
      if (!validPeriods.includes(period)) {
        return new Response('Invalid period', { status: 400 });
      }
    }

    // Validate amount if provided
    if (amount !== undefined && parseFloat(amount) <= 0) {
      return new Response('Amount must be greater than zero', { status: 400 });
    }

    // Validate dates if provided
    if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
      return new Response('End date must be after start date', { status: 400 });
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
      .eq('user_id', user.id)
      .select(`
        *,
        categories(name, color, icon)
      `)
      .single();

    if (error) {
      console.error('Error updating budget:', error);
      return new Response('Internal Server Error', { status: 500 });
    }

    if (!budget) {
      return new Response('Budget not found', { status: 404 });
    }

    return new Response(JSON.stringify(budget), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/budgets:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
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
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response('Budget ID is required', { status: 400 });
    }

    // Delete budget
    const { data: budget, error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting budget:', error);
      return new Response('Internal Server Error', { status: 500 });
    }

    if (!budget) {
      return new Response('Budget not found', { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Budget deleted successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in DELETE /api/budgets:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};