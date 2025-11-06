import type { RequestHandler } from './$types';
import { microsoftAuth } from '$lib/server/oauth';
import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia';
import { upsertProfile } from '$lib/server/profile';

const cookieOptions = {
  path: '/',
  httpOnly: true,
  secure: !dev,
  sameSite: 'lax' as const
};

const sanitize = (value: string | null) => {
  if (!value || !value.startsWith('/')) return '/';
  return value;
};

export const GET: RequestHandler = async ({ url, cookies, locals }) => {
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const storedState = cookies.get('oauth_state');

  if (!state || !code || !storedState || state !== storedState) {
    throw redirect(302, '/(auth)/login?message=OAuth%20state%20mismatch');
  }

  cookies.delete('oauth_state', cookieOptions);
  const redirectTo = sanitize(cookies.get('oauth_redirect'));
  cookies.delete('oauth_redirect', cookieOptions);

  const { getExistingUser, microsoftUser, createUser } = await microsoftAuth.validateCallback(code);

  let user = await getExistingUser();
  if (!user) {
    if (!microsoftUser.email) {
      throw redirect(302, '/(auth)/login?message=Microsoft%20account%20missing%20email');
    }
    user = await createUser({
      attributes: {
        email: microsoftUser.email,
        email_verified: microsoftUser.emailVerified ? 1 : 0
      }
    });
  }

  const session = await auth.createSession({
    userId: user.id,
    attributes: {}
  });
  await locals.auth.setSession(session);

  if (microsoftUser.name) {
    upsertProfile(user.id, { name: microsoftUser.name });
  }

  throw redirect(302, redirectTo);
};
