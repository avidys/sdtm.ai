import type { ComplianceRunSummary } from './types';

export function generateDefineXML(summary: ComplianceRunSummary): string {
  const datasetsXml = summary.datasets
    .map((dataset) => {
      return `    <ItemGroupDef OID="IG.${dataset.domain}" Name="${dataset.domain}" Repeating="No" Purpose="Tabulation" SASDatasetName="${dataset.domain}">
      <Description>
        <TranslatedText xml:lang="en">${dataset.name} (${dataset.rowCount} rows)</TranslatedText>
      </Description>
    </ItemGroupDef>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Define xmlns="http://www.cdisc.org/ns/def/v2.0" xmlns:xlink="http://www.w3.org/1999/xlink">
  <Study OID="STUDY">
    <GlobalVariables>
      <StudyName>SDTM.ai Validation Study</StudyName>
      <StudyDescription>Generated from SDTM.ai compliance run on ${summary.startedAt}</StudyDescription>
      <ProtocolName>${summary.metadata?.protocol ?? 'Unknown Protocol'}</ProtocolName>
    </GlobalVariables>
  </Study>
  <ItemGroupDefs>
${datasetsXml}
  </ItemGroupDefs>
</Define>`;
}

export function generateDefineHTML(summary: ComplianceRunSummary): string {
  const rows = summary.datasets
    .map(
      (dataset) => `      <tr>
        <td>${dataset.domain}</td>
        <td>${dataset.name}</td>
        <td>${dataset.rowCount}</td>
        <td>${dataset.columnCount}</td>
      </tr>`
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Define-XML HTML View</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; }
      th { background: #f3f4f6; text-align: left; }
    </style>
  </head>
  <body>
    <h1>Define-XML Snapshot</h1>
    <p>Generated from SDTM.ai compliance run on ${summary.startedAt}.</p>
    <table>
      <thead>
        <tr>
          <th>Domain</th>
          <th>Filename</th>
          <th>Rows</th>
          <th>Columns</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </body>
</html>`;
}
