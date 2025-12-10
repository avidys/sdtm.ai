import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.session) {
    throw redirect(302, '/dashboard');
  }
  return {};
};

export const actions: Actions = {
  email: async ({ request, locals, url }) => {
    const data = Object.fromEntries(await request.formData());
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      return fail(400, { errors: parsed.error.flatten().fieldErrors });
    }

    const { error } = await locals.supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password
    });
    if (error) {
      return fail(400, { message: error.message });
    }

    throw redirect(303, '/dashboard');
  },
  google: async ({ locals, url }) => {
    const { data, error } = await locals.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${url.origin}/auth/callback`
      }
    });
    if (error) {
      return fail(400, { message: error.message });
    }
    if (data.url) {
      throw redirect(303, data.url);
    }
  },
  microsoft: async ({ locals, url }) => {
    const { data, error } = await locals.supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${url.origin}/auth/callback`
      }
    });
    if (error) {
      return fail(400, { message: error.message });
    }
    if (data.url) {
      throw redirect(303, data.url);
    }
  }
};
