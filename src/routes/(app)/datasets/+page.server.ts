import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { parseDatasetFile } from '$lib/parsers';
import { loadStandardDefinition } from '$lib/standards/loader';
import { runComplianceCheck } from '$lib/standards/compliance';
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

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.session) {
      throw redirect(303, '/login');
    }

    const formData = await request.formData();
    const standardId = String(formData.get('standard'));
    if (!standardId) {
      return fail(400, { message: 'Please select a standard to validate against.' });
    }

    const files = formData.getAll('files') as File[];
    if (files.length === 0) {
      return fail(400, { message: 'Please upload at least one dataset file.' });
    }

    try {
      const standard = await loadStandardDefinition(standardId);
      const ingested = [] as { datasetId: string; runId: string }[];

      for (const file of files) {
        const dataset = await parseDatasetFile(file);
        const stored = await locals.database.upsertDataset(dataset);
        const run = runComplianceCheck({ standard, dataset });
        const storedRun = {
          ...run,
          datasetId: stored.id,
          datasetName: stored.name
        };
        locals.database.saveRun(storedRun);
        ingested.push({ datasetId: stored.id, runId: storedRun.id });
      }

      return {
        success: true,
        ingested,
        message: `Processed ${ingested.length} dataset(s).`
      };
    } catch (cause) {
      console.error('Ingestion failed', cause);
      return fail(500, { message: 'Unable to process the uploaded files.' });
    }
  }
};
