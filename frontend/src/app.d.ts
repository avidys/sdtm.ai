// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from '$lib/server/database';
//import type { ComplianceRun } from '$lib/standards/types';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      session: Session | null;
      user: User | null; // Authenticated user from getUser()
      database: Database;
    }
    interface PageData {
      session: Session | null;
      profile?: import('$lib/server/profile').UserProfile | null;
      standards?: import('$lib/standards/types').StandardSummary[];
    }
  }
}

export {};
