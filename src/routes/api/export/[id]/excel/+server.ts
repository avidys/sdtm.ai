import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { exportFindingsToWorkbook } from '$lib/export/excel';

export const GET: RequestHandler = async ({ params, locals }) => {
  const run = locals.database.getRun(params.id);
  if (!run) {
    throw error(404, 'Run not found');
  }
  const workbook = await exportFindingsToWorkbook(run);
  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${run.datasetName}-findings.xlsx"`
    }
  });
};
