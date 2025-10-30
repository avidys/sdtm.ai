import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { loadStandardDefinition } from '$lib/standards/loader';
import { generateDefineXml } from '$lib/export/define';

export const GET: RequestHandler = async ({ params, locals }) => {
  const run = locals.database.getRun(params.id);
  if (!run) {
    throw error(404, 'Run not found');
  }
  const dataset = locals.database.getDataset(run.datasetId);
  if (!dataset) {
    throw error(404, 'Dataset not found for run');
  }
  const standard = await loadStandardDefinition(run.standardId);
  const xml = generateDefineXml(dataset, standard, run);
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="${run.datasetName}-define.xml"`
    }
  });
};
