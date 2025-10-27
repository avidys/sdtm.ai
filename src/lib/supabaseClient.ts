import { createBrowserClient, createServerClient } from '@supabase/auth-helpers-sveltekit';
import { env } from '$env/dynamic/public';
import { env as serverEnv } from '$env/dynamic/private';
import type { Database } from '$lib/types/database';

export const createSupabaseClient = () =>
  createBrowserClient<Database>(
    env.PUBLIC_SUPABASE_URL ?? '',
    env.PUBLIC_SUPABASE_ANON_KEY ?? ''
  );

export const createSupabaseServerClient = (fetch: typeof globalThis.fetch) =>
  createServerClient<Database>(
    serverEnv.PRIVATE_SUPABASE_URL ?? '',
    serverEnv.PRIVATE_SUPABASE_SERVICE_ROLE_KEY ?? '',
    { fetch }
  );
