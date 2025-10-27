import type { LayoutServerLoad } from './$types';
import { getProfile } from '$lib/server/profile';
import { STANDARD_CATALOG } from '$lib/standards/catalog';

export const load: LayoutServerLoad = async ({ locals }) => {
  const profile = await getProfile(locals.supabase, locals.session);
  return {
    session: locals.session,
    profile,
    standards: STANDARD_CATALOG
  };
};
