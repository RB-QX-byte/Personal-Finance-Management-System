import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

// GET /api/goals/[id] - Fetch a specific goal
export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const goalId = params.id;
    
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

    // Fetch goal
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single();

    if (goalError || !goal) {
      return new Response(
        JSON.stringify({ error: 'Goal not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(goal),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/goals/[id] - Update a goal
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const goalId = params.id;
    
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
    const updateData: any = {};

    // Build update object with only provided fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.target_amount !== undefined) {
      if (body.target_amount <= 0) {
        return new Response(
          JSON.stringify({ error: 'Target amount must be greater than 0' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      updateData.target_amount = parseFloat(body.target_amount);
    }
    if (body.current_amount !== undefined) {
      if (body.current_amount < 0) {
        return new Response(
          JSON.stringify({ error: 'Current amount cannot be negative' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      updateData.current_amount = parseFloat(body.current_amount);
    }
    if (body.target_date !== undefined) updateData.target_date = body.target_date;
    if (body.is_completed !== undefined) updateData.is_completed = body.is_completed;

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update goal
    const { data: goal, error: updateError } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update goal', details: updateError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!goal) {
      return new Response(
        JSON.stringify({ error: 'Goal not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(goal),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/goals/[id] - Delete a goal (soft delete)
export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const goalId = params.id;
    
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

    // Soft delete goal (set is_active to false)
    const { data: goal, error: deleteError } = await supabase
      .from('goals')
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete goal', details: deleteError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!goal) {
      return new Response(
        JSON.stringify({ error: 'Goal not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Goal deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};