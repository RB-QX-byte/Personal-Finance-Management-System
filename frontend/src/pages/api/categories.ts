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

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return new Response('Internal Server Error', { status: 500 });
    }

    return new Response(JSON.stringify(categories), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/categories:', error);
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
    const { name, description, color, icon } = body;

    // Validate required fields
    if (!name) {
      return new Response('Category name is required', { status: 400 });
    }

    // Insert new category
    const { data: category, error } = await supabase
      .from('categories')
      .insert([
        {
          user_id: user.id,
          name,
          description: description || null,
          color: color || '#6366f1',
          icon: icon || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      if (error.code === '23505') {
        return new Response('Category name already exists', { status: 409 });
      }
      return new Response('Internal Server Error', { status: 500 });
    }

    return new Response(JSON.stringify(category), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/categories:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};