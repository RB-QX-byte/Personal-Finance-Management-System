import { defineMiddleware } from 'astro:middleware';
import { getSession } from './lib/auth';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/accounts',
  '/transactions',
  '/budgets',
  '/goals',
  '/settings',
];

// Define public routes that redirect authenticated users
const publicRoutes = [
  '/login',
  '/register',
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;
  const pathname = url.pathname;

  // Get auth tokens from cookies
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;

  // Check if user is authenticated
  const session = await getSession(accessToken, refreshToken);
  const isAuthenticated = !!session;

  // Handle protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
    
    // Add user to context for protected pages
    context.locals.user = session.user;
    context.locals.session = session;
  }

  // Handle public routes (redirect authenticated users to dashboard)
  if (publicRoutes.includes(pathname) && isAuthenticated) {
    const redirectTo = url.searchParams.get('redirect') || '/dashboard';
    return redirect(redirectTo);
  }

  // Add authentication status to all pages
  context.locals.isAuthenticated = isAuthenticated;
  if (isAuthenticated) {
    context.locals.user = session.user;
    context.locals.session = session;
  }

  return next();
});