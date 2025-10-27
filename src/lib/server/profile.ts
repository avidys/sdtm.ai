import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string | null;
  organization?: string | null;
  createdAt?: string;
}

const profileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string().nullish(),
  organization: z.string().nullish(),
  created_at: z.string().nullish()
});

export async function getProfile(
  supabase: SupabaseClient,
  session: Session | null
): Promise<UserProfile | null> {
  if (!session) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();
  if (error) {
    console.error('Unable to fetch profile', error);
    return {
      id: session.user.id,
      email: session.user.email ?? 'unknown'
    };
  }
  if (!data) {
    return {
      id: session.user.id,
      email: session.user.email ?? 'unknown'
    };
  }
  const parsed = profileSchema.parse(data);
  return {
    id: parsed.id,
    email: parsed.email,
    fullName: parsed.full_name,
    organization: parsed.organization,
    createdAt: parsed.created_at ?? undefined
  };
}

export async function upsertProfile(
  supabase: SupabaseClient,
  profile: UserProfile
) {
  const payload = {
    id: profile.id,
    email: profile.email,
    full_name: profile.fullName ?? null,
    organization: profile.organization ?? null
  };
  const { error } = await supabase.from('profiles').upsert(payload);
  if (error) {
    throw error;
  }
}
