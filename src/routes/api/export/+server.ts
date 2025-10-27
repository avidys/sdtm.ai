import type { RequestHandler } from './$types';
import { buildWorkbook } from '$lib/compliance/excel';

export const POST: RequestHandler = async ({ request }) => {
  const summary = await request.json();
  const buffer = buildWorkbook(summary);

  return new Response(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="sdtm-compliance.xlsx"'
    }
  });
};
