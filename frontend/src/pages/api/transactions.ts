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
    const accountId = url.searchParams.get('account_id');
    const categoryId = url.searchParams.get('category_id');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = supabase
      .from('transactions')
      .select(`
        *,
        accounts(name, account_type),
        categories(name, color)
      `)
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    if (search) {
      query = query.ilike('description', `%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return new Response('Internal Server Error', { status: 500 });
    }

    return new Response(JSON.stringify(transactions), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/transactions:', error);
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
      account_id, 
      category_id, 
      amount, 
      transaction_type, 
      description, 
      transaction_date, 
      notes 
    } = body;

    // Validate required fields
    if (!account_id || !amount || !transaction_type) {
      return new Response('Account ID, amount, and transaction type are required', { status: 400 });
    }

    // Validate transaction type
    const validTypes = ['income', 'expense', 'transfer'];
    if (!validTypes.includes(transaction_type)) {
      return new Response('Invalid transaction type', { status: 400 });
    }

    // Validate amount
    if (parseFloat(amount) === 0) {
      return new Response('Amount cannot be zero', { status: 400 });
    }

    // Verify account belongs to user
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', account_id)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      return new Response('Account not found', { status: 404 });
    }

    // Insert new transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: user.id,
          account_id,
          category_id: category_id || null,
          amount: parseFloat(amount),
          transaction_type,
          description: description || null,
          transaction_date: transaction_date || new Date().toISOString().split('T')[0],
          notes: notes || null,
        },
      ])
      .select(`
        *,
        accounts(name, account_type),
        categories(name, color)
      `)
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return new Response('Internal Server Error', { status: 500 });
    }

    return new Response(JSON.stringify(transaction), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/transactions:', error);
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
      account_id, 
      category_id, 
      amount, 
      transaction_type, 
      description, 
      transaction_date, 
      notes 
    } = body;

    if (!id) {
      return new Response('Transaction ID is required', { status: 400 });
    }

    // Validate transaction type if provided
    if (transaction_type) {
      const validTypes = ['income', 'expense', 'transfer'];
      if (!validTypes.includes(transaction_type)) {
        return new Response('Invalid transaction type', { status: 400 });
      }
    }

    // Validate amount if provided
    if (amount !== undefined && parseFloat(amount) === 0) {
      return new Response('Amount cannot be zero', { status: 400 });
    }

    // Build update object
    const updateData: any = {};
    if (account_id) updateData.account_id = account_id;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (transaction_type) updateData.transaction_type = transaction_type;
    if (description !== undefined) updateData.description = description;
    if (transaction_date) updateData.transaction_date = transaction_date;
    if (notes !== undefined) updateData.notes = notes;

    // Update transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        accounts(name, account_type),
        categories(name, color)
      `)
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      return new Response('Internal Server Error', { status: 500 });
    }

    if (!transaction) {
      return new Response('Transaction not found', { status: 404 });
    }

    return new Response(JSON.stringify(transaction), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/transactions:', error);
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
      return new Response('Transaction ID is required', { status: 400 });
    }

    // Delete transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting transaction:', error);
      return new Response('Internal Server Error', { status: 500 });
    }

    if (!transaction) {
      return new Response('Transaction not found', { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Transaction deleted successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in DELETE /api/transactions:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};