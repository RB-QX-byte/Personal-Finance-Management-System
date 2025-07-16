import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!data.session) {
      return new Response(
        JSON.stringify({ error: 'No session created' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Set HTTP-only cookie with the session
    const response = new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // Ensure user profile exists
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();
      
      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || '',
            currency_preference: data.user.user_metadata?.currency_preference || 'USD',
            updated_at: new Date().toISOString()
          });
        
        if (profileError && profileError.code !== '23505') { // Ignore duplicate key error
          console.error('Profile creation error during login:', profileError);
        }
      }
    } catch (profileError) {
      console.error('Profile check/creation failed during login:', profileError);
      // Don't fail login if profile creation fails
    }

    // Set HTTP-only cookies (secure flag only in production)
    const isProduction = import.meta.env.PROD;
    const secureFlag = isProduction ? '; Secure' : '';
    
    response.headers.append('Set-Cookie', 
      `sb-access-token=${data.session.access_token}; Path=/; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=${data.session.expires_in}`
    );

    response.headers.append('Set-Cookie', 
      `sb-refresh-token=${data.session.refresh_token}; Path=/; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}` // 30 days
    );

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};