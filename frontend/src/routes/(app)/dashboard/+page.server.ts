import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { STANDARD_CATALOG } from '$lib/standards/catalog';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.session) {
    throw redirect(303, '/login');
  }
  return {
    datasets: locals.database.listDatasets(),
    runs: locals.database.listRuns(),
    standards: STANDARD_CATALOG
  };
};
