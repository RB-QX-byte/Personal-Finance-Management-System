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

    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching accounts:', error);
      return new Response('Internal Server Error', { status: 500 });
    }

    return new Response(JSON.stringify(accounts), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/accounts:', error);
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
    const { name, account_type, balance, description } = body;

    // Validate required fields
    if (!name || !account_type) {
      return new Response('Name and account type are required', { status: 400 });
    }

    // Validate account type
    const validTypes = ['checking', 'savings', 'credit_card', 'investment', 'loan', 'other'];
    if (!validTypes.includes(account_type)) {
      return new Response('Invalid account type', { status: 400 });
    }

    // Insert new account
    const { data: account, error } = await supabase
      .from('accounts')
      .insert([
        {
          user_id: user.id,
          name,
          account_type,
          balance: parseFloat(balance) || 0,
          description: description || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating account:', error);
      if (error.code === '23505') {
        return new Response('Account name already exists', { status: 409 });
      }
      return new Response('Internal Server Error', { status: 500 });
    }

    return new Response(JSON.stringify(account), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/accounts:', error);
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
    const { id, name, account_type, balance, description } = body;

    if (!id) {
      return new Response('Account ID is required', { status: 400 });
    }

    // Validate account type if provided
    if (account_type) {
      const validTypes = ['checking', 'savings', 'credit_card', 'investment', 'loan', 'other'];
      if (!validTypes.includes(account_type)) {
        return new Response('Invalid account type', { status: 400 });
      }
    }

    // Update account
    const updateData: any = {};
    if (name) updateData.name = name;
    if (account_type) updateData.account_type = account_type;
    if (balance !== undefined) updateData.balance = parseFloat(balance);
    if (description !== undefined) updateData.description = description;

    const { data: account, error } = await supabase
      .from('accounts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating account:', error);
      if (error.code === '23505') {
        return new Response('Account name already exists', { status: 409 });
      }
      return new Response('Internal Server Error', { status: 500 });
    }

    if (!account) {
      return new Response('Account not found', { status: 404 });
    }

    return new Response(JSON.stringify(account), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/accounts:', error);
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
      return new Response('Account ID is required', { status: 400 });
    }

    // Soft delete by setting is_active to false
    const { data: account, error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting account:', error);
      return new Response('Internal Server Error', { status: 500 });
    }

    if (!account) {
      return new Response('Account not found', { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Account deleted successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in DELETE /api/accounts:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};