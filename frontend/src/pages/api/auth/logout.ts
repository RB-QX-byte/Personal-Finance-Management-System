import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Get the access token from cookies
    const accessToken = cookies.get('sb-access-token')?.value;

    if (accessToken) {
      // Set the session for logout
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: cookies.get('sb-refresh-token')?.value || '',
      });

      // Sign out from Supabase
      await supabase.auth.signOut();
    }

    // Create response
    const response = new Response(
      JSON.stringify({ success: true, message: 'Logged out successfully' }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // Clear the authentication cookies
    response.headers.set('Set-Cookie', 
      'sb-access-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    );

    response.headers.append('Set-Cookie', 
      'sb-refresh-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    );

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, clear the cookies
    const response = new Response(
      JSON.stringify({ success: true, message: 'Logged out' }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    response.headers.set('Set-Cookie', 
      'sb-access-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    );

    response.headers.append('Set-Cookie', 
      'sb-refresh-token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    );

    return response;
  }
};