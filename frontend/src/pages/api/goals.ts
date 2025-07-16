import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// GET /api/goals - Fetch all goals for the authenticated user
export const GET: APIRoute = async ({ cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (goalsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch goals', details: goalsError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ goals: goals || [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/goals - Create a new goal
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { name, description, target_amount, current_amount = 0, target_date } = body;

    // Validate required fields
    if (!name || !target_amount || target_amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Name and positive target amount are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create goal
    const { data: goal, error: createError } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        name,
        description,
        target_amount: parseFloat(target_amount),
        current_amount: parseFloat(current_amount) || 0,
        target_date: target_date || null,
      })
      .select()
      .single();

    if (createError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create goal', details: createError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(goal),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};