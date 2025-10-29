//import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { createDatabase } from '$lib/server/database';
import { env } from '$env/dynamic/private';

const database = createDatabase();


export const handle: Handle = async ({ event, resolve }) => {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY;
  //const supabaseUrl = process.env.SUPABASE_URL ?? '';
  //const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are not configured. Authentication will be disabled.');
  }
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get: (key) => event.cookies.get(key),
        set: (key, value, options) => {
          event.cookies.set(key, value, {
            path: '/',
            sameSite: 'lax',
            ...options
          });
        },
        remove: (key, options) => {
          event.cookies.delete(key, {
            path: '/',
            ...options
          });
        }
      }
    }
  );

  event.locals.supabase = supabase;
  
  // Use getUser() instead of getSession() for security - authenticates with server
  // getUser() validates the token with Supabase server, preventing cookie tampering
  // This eliminates the warning about insecure session.user usage
  const {
    data: { user }
  } = await supabase.auth.getUser();
  
  // CRITICAL: Never use session.user - it's from untrusted cookies
  // We only get session for token storage, but user authentication comes from getUser()
  // If user is null, session should also be null (user not authenticated)
  const session = user 
    ? await supabase.auth.getSession().then(({ data }) => data?.session ?? null)
    : null;
  
  event.locals.session = session; // Only used for token storage, NOT for user data
  event.locals.user = user; // Use this for all user authentication - validated with server
  event.locals.database = database;

  return resolve(event);
};
