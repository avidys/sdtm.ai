import * as XLSX from 'xlsx';
import type { ComplianceRunSummary } from './types';

export function buildWorkbook(summary: ComplianceRunSummary): Buffer {
  const wb = XLSX.utils.book_new();
  const datasetSheet = XLSX.utils.json_to_sheet(
    summary.datasets.map((dataset) => ({
      Domain: dataset.domain,
      Filename: dataset.name,
      Format: dataset.format,
      Rows: dataset.rowCount,
      Columns: dataset.columnCount
    }))
  );
  XLSX.utils.book_append_sheet(wb, datasetSheet, 'Datasets');

  const findingsSheet = XLSX.utils.json_to_sheet(
    summary.findings.map((finding) => ({
      ID: finding.id,
      Dataset: finding.dataset ?? '',
      Variable: finding.variable ?? '',
      Severity: finding.severity,
      Message: finding.message,
      Recommendation: finding.recommendation ?? '',
      Reference: finding.reference ?? ''
    }))
  );
  XLSX.utils.book_append_sheet(wb, findingsSheet, 'Findings');

  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}
