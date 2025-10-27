import { createDuckDB, closeDuckDB, stageDatasets } from '$lib/db/duckdb';
import { inferFormat, parseDataset } from './parsers';
import { ruleRegistry } from './rules';
import type { ComplianceRunSummary, Finding, ParsedDataset } from './types';

export interface ComplianceFile {
  name: string;
  contents: Uint8Array;
}

export interface ComplianceOptions {
  standardId: string;
  persistSummary?: (summary: ComplianceRunSummary) => Promise<void>;
}

export async function runCompliance(
  files: ComplianceFile[],
  options: ComplianceOptions
): Promise<ComplianceRunSummary> {
  const datasets: ParsedDataset[] = [];
  for (const file of files) {
    const format = inferFormat(file.name);
    const parsed = await parseDataset(file.name, format, file.contents);
    datasets.push(parsed);
  }

  const connection = createDuckDB();

  try {
    await stageDatasets(connection, datasets);

    const findings: Finding[] = [];
    const rules = ruleRegistry[options.standardId] ?? [];
    for (const rule of rules) {
      findings.push(...rule.apply(datasets));
    }

    const summary: ComplianceRunSummary = {
      startedAt: new Date().toISOString(),
      standardId: options.standardId,
      datasets: datasets.map((dataset) => ({
        name: dataset.name,
        domain: dataset.domain,
        format: inferFormat(dataset.name),
        rowCount: dataset.rows.length,
        columnCount: dataset.columns.length
      })),
      findings,
      metadata: {
        duckdb: 'in-memory',
        fileCount: files.length
      }
    };

    if (options.persistSummary) {
      await options.persistSummary(summary);
    }

    return summary;
  } finally {
    closeDuckDB(connection);
  }
}
