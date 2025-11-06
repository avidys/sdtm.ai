import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { appEnv } from '$lib/server/env';
import { createMagicToken } from '$lib/server/magic';
import { sendMagicLinkEmail } from '$lib/server/email';
import { db } from '$lib/server/db';

const emailSchema = z.string().email({ message: 'Enter a valid email address' });

const sanitizeRedirect = (value: FormDataEntryValue | null | string): string => {
  if (typeof value !== 'string' || value.length === 0) return '/';
  if (!value.startsWith('/')) return '/';
  return value;
};

export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user) {
    throw redirect(302, sanitizeRedirect(url.searchParams.get('redirectTo')));
  }

  return {
    redirectTo: sanitizeRedirect(url.searchParams.get('redirectTo')),
    message: url.searchParams.get('message') ?? null
  };
};

export const actions: Actions = {
  magicLink: async ({ request }) => {
    const form = await request.formData();
    const emailInput = form.get('email');
    const nameInput = form.get('name');
    const redirectTo = sanitizeRedirect(form.get('redirectTo'));

    if (typeof emailInput !== 'string') {
      return fail(400, { error: 'Email is required', email: '' });
    }

    const parsedEmail = emailSchema.safeParse(emailInput.trim().toLowerCase());
    if (!parsedEmail.success) {
      return fail(400, { error: parsedEmail.error.issues[0]?.message ?? 'Invalid email', email: emailInput });
    }

    const normalizedEmail = parsedEmail.data;

    const existingUser = db
      .prepare('SELECT id FROM user WHERE email = ?')
      .get(normalizedEmail) as { id: string } | undefined;

    const { token, expiresAt } = createMagicToken(
      normalizedEmail,
      existingUser?.id ?? null,
      appEnv.MAGIC_LINK_EXPIRY_MINUTES * 60,
      {
        name: typeof nameInput === 'string' && nameInput.trim() ? nameInput.trim() : null,
        redirectTo
      }
    );

    const link = `${appEnv.BASE_URL}/auth/email?token=${token}`;

    await sendMagicLinkEmail({ email: normalizedEmail, link });

    return {
      success: true,
      email: normalizedEmail,
      expiresAt,
      magicLink: link
    };
  }
};
