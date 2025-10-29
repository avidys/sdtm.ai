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
  const {
    data: { session }
  } = await supabase.auth.getSession();
  event.locals.session = session;
  event.locals.database = database;

  return resolve(event);
};
