import type { LayoutServerLoad } from './$types';
import { getProfile } from '$lib/server/profile';
import { STANDARD_CATALOG } from '$lib/standards/catalog';
import { env } from '$env/dynamic/private';

export const load: LayoutServerLoad = async ({ locals }) => {
  // Use authenticated user from getUser() instead of session.user for security
  const profile = await getProfile(
    locals.supabase,
    locals.user?.id ?? null,
    locals.user?.email ?? null
  );
  return {
    session: locals.session,
    profile,
    standards: STANDARD_CATALOG,
		deploymentGitBranch: env.VERCEL_COMMIT_REF
  };
};

