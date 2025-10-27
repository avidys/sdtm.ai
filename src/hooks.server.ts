import type { Handle } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/supabaseClient';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createSupabaseServerClient(event.fetch);
  event.locals.getSession = async () => {
    const {
      data: { session }
    } = await event.locals.supabase.auth.getSession();
    return session;
  };

  return resolve(event, {
    filterSerializedResponseHeaders: (name) => name === 'content-range'
  });
};
