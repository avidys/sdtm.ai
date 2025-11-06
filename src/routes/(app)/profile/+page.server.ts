import type { Actions, PageServerLoad } from './$types';
import { getProfile, upsertProfile } from '$lib/server/profile';
import { error, fail } from '@sveltejs/kit';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120).optional(),
  preferences: z.string().trim().max(2048).optional()
});

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    throw error(401, 'Not authenticated');
  }

  const profile = getProfile(user.id);

  return {
    profile: {
      name: profile?.name ?? '',
      email: user.email,
      preferences: profile?.preferences ?? ''
    }
  };
};

export const actions: Actions = {
  update: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) {
      return fail(401, { message: 'Not authenticated' });
    }

    const formData = await request.formData();
    const candidate = {
      name: formData.get('name'),
      preferences: formData.get('preferences')
    };
    const parsed = profileSchema.safeParse(candidate);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid form submission';
      return fail(400, {
        error: message,
        profile: {
          name: typeof candidate.name === 'string' ? candidate.name : '',
          preferences: typeof candidate.preferences === 'string' ? candidate.preferences : '',
          email: user.email
        }
      });
    }

    const updated = upsertProfile(user.id, parsed.data);

    return {
      success: true,
      profile: {
        name: updated?.name ?? '',
        email: user.email,
        preferences: updated?.preferences ?? ''
      }
    };
  }
};
