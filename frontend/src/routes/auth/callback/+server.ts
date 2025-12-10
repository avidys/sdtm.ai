import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  const code = url.searchParams.get('code');
  
  if (code) {
    const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      throw redirect(303, '/dashboard');
    }
  }

  // If there's an error or no code, redirect to login
  throw redirect(303, '/login');
};

