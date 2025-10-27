import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
  const { session, profile } = await parent();
  if (!session) {
    throw redirect(302, '/auth');
  }

  return { session, profile };
};

export const actions: Actions = {
  default: async ({ request, locals, parent }) => {
    const { session } = await parent();
    if (!session) {
      throw redirect(302, '/auth');
    }

    const form = await request.formData();
    const display_name = form.get('display_name')?.toString() ?? null;
    const organization = form.get('organization')?.toString() ?? null;

    const { error } = await locals.supabase
      .from('profiles')
      .upsert(
        {
          id: session.user.id,
          email: session.user.email ?? '',
          display_name,
          organization,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );

    if (error) {
      return fail(500, { message: error.message });
    }

    return { success: true };
  }
};
