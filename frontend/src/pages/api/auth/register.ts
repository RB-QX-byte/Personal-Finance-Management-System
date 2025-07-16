import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password, fullName, currency } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
          currency_preference: currency || 'USD',
        }
      }
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user needs email confirmation
    if (data.user && !data.session) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Registration successful! Please check your email for verification.',
          requiresEmailConfirmation: true
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // If session exists (email confirmation disabled), set cookies
    if (data.session) {
      const response = new Response(
        JSON.stringify({ 
          success: true,
          message: 'Registration successful!',
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
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Registration successful!'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};