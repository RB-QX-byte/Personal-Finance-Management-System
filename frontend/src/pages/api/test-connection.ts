import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Test basic connection by querying a simple metadata table
    const { data, error } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Supabase connection successful',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Connection test failed:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to connect to Supabase' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};