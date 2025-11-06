import type { RequestHandler } from './$types';
import { googleAuth } from '$lib/server/oauth';
import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';

const cookieOptions = {
  path: '/',
  httpOnly: true,
  secure: !dev,
  sameSite: 'lax' as const,
  maxAge: 60 * 10
};

const sanitize = (value: string | null) => {
  if (!value || !value.startsWith('/')) return '/';
  return value;
};

export const GET: RequestHandler = async ({ cookies, url }) => {
  const redirectTo = sanitize(url.searchParams.get('redirectTo'));
  const [authorizationUrl, state] = await googleAuth.getAuthorizationUrl();

  cookies.set('oauth_state', state, cookieOptions);
  cookies.set('oauth_redirect', redirectTo, cookieOptions);

  throw redirect(302, authorizationUrl.toString());
};
