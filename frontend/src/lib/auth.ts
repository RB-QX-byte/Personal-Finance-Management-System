import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthSession {
  user: User;
  accessToken: string;
}

export async function getSession(accessToken?: string, refreshToken?: string): Promise<AuthSession | null> {
  if (!accessToken) {
    return null;
  }

  try {
    // Set the session with the tokens
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });

    if (sessionError || !sessionData.session) {
      return null;
    }

    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return null;
    }

    return {
      user: userData.user,
      accessToken: sessionData.session.access_token,
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function requireAuth(accessToken?: string, refreshToken?: string): Promise<AuthSession> {
  const session = await getSession(accessToken, refreshToken);
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  return session;
}

export function redirectToLogin(currentPath?: string): Response {
  const loginUrl = currentPath ? `/login?redirect=${encodeURIComponent(currentPath)}` : '/login';
  return new Response(null, {
    status: 302,
    headers: {
      Location: loginUrl,
    },
  });
}