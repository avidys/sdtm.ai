import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { runCompliance, type ComplianceFile } from '$lib/compliance/checker';

export const POST: RequestHandler = async ({ request, locals }) => {
  const form = await request.formData();
  const standardId = form.get('standardId')?.toString() ?? 'sdtmig-v4-3';
  const files: ComplianceFile[] = [];

  for (const value of form.values()) {
    if (value instanceof File) {
      const buffer = new Uint8Array(await value.arrayBuffer());
      files.push({ name: value.name, contents: buffer });
    }
  }

  if (files.length === 0) {
    return json({ error: 'No files provided' }, { status: 400 });
  }

  const session = await locals.getSession();

  const summary = await runCompliance(files, {
    standardId,
    persistSummary: session
      ? async (result) => {
          await locals.supabase.from('runs').insert({
            user_id: session.user.id,
            standard_id: standardId,
            summary: result as any
          });
        }
      : undefined
  });

  return json(summary);
};
