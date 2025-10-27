import type { RequestHandler } from './$types';
import { generateDefineHTML, generateDefineXML } from '$lib/compliance/define';

export const POST: RequestHandler = async ({ request, url }) => {
  const summary = await request.json();
  const format = url.searchParams.get('format') ?? 'xml';

  if (format === 'html') {
    const html = generateDefineHTML(summary);
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'attachment; filename="define.html"'
      }
    });
  }

  const xml = generateDefineXML(summary);
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': 'attachment; filename="define.xml"'
    }
  });
};
