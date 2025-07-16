import type { APIRoute } from 'astro';
import { supabase } from '../../../../lib/supabase';

// GET /api/goals/[id]/progress - Get goal progress details
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

    // Calculate progress metrics
    const progressPercentage = (goal.current_amount / goal.target_amount) * 100;
    const remaining = goal.target_amount - goal.current_amount;
    
    let daysRemaining = null;
    if (goal.target_date) {
      const targetDate = new Date(goal.target_date);
      const today = new Date();
      const timeDiff = targetDate.getTime() - today.getTime();
      daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    }

    let status = 'just_started';
    if (goal.is_completed) {
      status = 'completed';
    } else if (progressPercentage >= 100) {
      status = 'target_reached';
    } else if (progressPercentage >= 75) {
      status = 'on_track';
    } else if (progressPercentage >= 25) {
      status = 'making_progress';
    }

    const progress = {
      goal_id: goal.id,
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      progress_percentage: progressPercentage,
      remaining_amount: Math.max(remaining, 0),
      is_completed: goal.is_completed,
      target_date: goal.target_date,
      days_remaining: daysRemaining,
      status: status,
    };

    return new Response(
      JSON.stringify(progress),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PATCH /api/goals/[id]/progress - Update goal progress
export const PATCH: APIRoute = async ({ params, request, cookies }) => {
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
    const { amount, set_absolute = false } = body;

    if (amount === undefined || amount === null) {
      return new Response(
        JSON.stringify({ error: 'Amount is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch current goal
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

    // Calculate new current amount
    let newCurrentAmount;
    if (set_absolute) {
      newCurrentAmount = parseFloat(amount);
    } else {
      newCurrentAmount = goal.current_amount + parseFloat(amount);
    }

    // Ensure current amount is not negative
    if (newCurrentAmount < 0) {
      newCurrentAmount = 0;
    }

    // Check if goal should be marked as completed
    const isCompleted = newCurrentAmount >= goal.target_amount;

    // Update goal
    const { data: updatedGoal, error: updateError } = await supabase
      .from('goals')
      .update({
        current_amount: newCurrentAmount,
        is_completed: isCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update goal progress', details: updateError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(updatedGoal),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};