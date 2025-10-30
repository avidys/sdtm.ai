import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { loadStandardDefinition } from '$lib/standards/loader';

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.session) {
    throw redirect(303, '/login');
  }
  const run = locals.database.getRun(params.id);
  if (!run) {
    throw error(404, 'Compliance run not found');
  }
  const dataset = locals.database.getDataset(run.datasetId);
  const standard = await loadStandardDefinition(run.standardId);
  return {
    run,
    dataset,
    standard
  };
};
