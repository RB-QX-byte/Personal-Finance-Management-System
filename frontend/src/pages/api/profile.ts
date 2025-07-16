import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { requireAuth } from '../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    const session = await requireAuth(accessToken, refreshToken);

    // Get user profile data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      
      // If profile doesn't exist, create one
      if (error.code === 'PGRST116') {
        console.log('Profile not found, creating new profile for user:', session.user.id);
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || '',
            currency_preference: session.user.user_metadata?.currency_preference || 'USD',
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Profile creation error:', createError);
          return new Response(
            JSON.stringify({ error: 'Failed to create profile' }),
            { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            profile: {
              ...newProfile,
              email: session.user.email,
            }
          }),
          { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profile' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        profile: {
          ...profile,
          email: session.user.email,
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Get profile error:', error);
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get('sb-access-token')?.value;
    const refreshToken = cookies.get('sb-refresh-token')?.value;

    const session = await requireAuth(accessToken, refreshToken);

    const { full_name, currency_preference } = await request.json();

    if (!full_name && !currency_preference) {
      return new Response(
        JSON.stringify({ error: 'At least one field is required for update' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (currency_preference !== undefined) updateData.currency_preference = currency_preference;

    // Update user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        profile: {
          ...profile,
          email: session.user.email,
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Update profile error:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};