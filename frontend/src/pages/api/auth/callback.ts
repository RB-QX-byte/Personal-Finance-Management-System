import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const GET: APIRoute = async ({ url, redirect }) => {
  try {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return redirect('/login?error=oauth_failed');
    }

    if (!code) {
      return redirect('/login?error=no_code');
    }

    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data.session) {
      console.error('Code exchange error:', exchangeError);
      return redirect('/login?error=exchange_failed');
    }

    // Create response with redirect
    const response = redirect('/dashboard');

    // Set secure HTTP-only cookies
    response.headers.set('Set-Cookie', 
      `sb-access-token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${data.session.expires_in}`
    );

    response.headers.append('Set-Cookie', 
      `sb-refresh-token=${data.session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}` // 30 days
    );

    return response;

  } catch (error) {
    console.error('Callback error:', error);
    return redirect('/login?error=callback_failed');
  }
};