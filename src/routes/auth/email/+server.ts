import type { RequestHandler } from './$types';
import { consumeMagicToken } from '$lib/server/magic';
import { auth } from '$lib/server/lucia';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { upsertProfile } from '$lib/server/profile';

interface MagicMetadata {
  name?: string | null;
  redirectTo?: string;
}

const ensureRelativeRedirect = (value: string | undefined | null) => {
  if (!value || !value.startsWith('/')) return '/';
  return value;
};

export const GET: RequestHandler = async ({ url, locals }) => {
  const token = url.searchParams.get('token');
  if (!token) {
    throw error(400, 'Missing token');
  }

  const record = consumeMagicToken(token);
  if (!record) {
    throw redirect(302, '/(auth)/login?message=Magic%20link%20expired');
  }

  let metadata: MagicMetadata = {};
  if (record.metadata) {
    try {
      metadata = JSON.parse(record.metadata) as MagicMetadata;
    } catch (err) {
      console.error('Failed to parse magic link metadata', err);
    }
  }

  const redirectTo = ensureRelativeRedirect(metadata.redirectTo);

  let userId = record.user_id;
  if (!userId) {
    const existingUser = db
      .prepare('SELECT id FROM user WHERE email = ?')
      .get(record.email) as { id: string } | undefined;
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const user = await auth.createUser({
        key: {
          providerId: 'magiclink',
          providerUserId: record.email,
          password: null
        },
        attributes: {
          email: record.email,
          email_verified: 1
        }
      });
      userId = user.id;
    }
  }

  if (!userId) {
    throw redirect(302, '/(auth)/login?message=Unable%20to%20complete%20sign-in');
  }

  const session = await auth.createSession({
    userId,
    attributes: {}
  });

  await locals.auth.setSession(session);

  if (metadata.name) {
    upsertProfile(userId, { name: metadata.name });
  }

  throw redirect(302, redirectTo);
};
