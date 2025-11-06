import type { RequestHandler } from './$types';
import { auth } from '$lib/server/lucia';
import { redirect } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals }) => {
  const session = await locals.auth.validate();
  if (session) {
    await auth.invalidateSession(session.id);
  }

  await locals.auth.setSession(null);
  throw redirect(302, '/(auth)/login');
};
