import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { getProfile, upsertProfile } from '$lib/server/profile';

const schema = z.object({
  fullName: z.string().optional(),
  organization: z.string().optional()
});

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.session) {
    throw redirect(303, '/login');
  }
  const profile = await getProfile(locals.supabase, locals.session);
  return { profile };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.session) {
      throw redirect(303, '/login');
    }
    const data = Object.fromEntries(await request.formData());
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      return fail(400, { errors: parsed.error.flatten().fieldErrors });
    }

    await upsertProfile(locals.supabase, {
      id: locals.session.user.id,
      email: locals.session.user.email ?? '',
      fullName: parsed.data.fullName,
      organization: parsed.data.organization
    });

    return { success: true };
  }
};
