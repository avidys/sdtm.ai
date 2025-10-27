// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      getSession(): Promise<import('@supabase/supabase-js').Session | null>;
    }
    interface PageData {
      session: import('@supabase/supabase-js').Session | null;
      profile: import('$lib/types/profile').Profile | null;
    }
  }
}

export {};
