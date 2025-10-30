import ExcelJS from 'exceljs';
import type { StoredComplianceRun } from '$lib/server/database';

export async function exportFindingsToWorkbook(run: StoredComplianceRun) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'sdtm.ai';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Findings');
  sheet.columns = [
    { header: 'Domain', key: 'domain', width: 12 },
    { header: 'Variable', key: 'variable', width: 18 },
    { header: 'Severity', key: 'severity', width: 12 },
    { header: 'Message', key: 'message', width: 80 },
    { header: 'Standard', key: 'standard', width: 24 },
    { header: 'Reference', key: 'reference', width: 40 }
  ];

  for (const finding of run.findings) {
    sheet.addRow({
      domain: finding.domain,
      variable: finding.variable ?? '',
      severity: finding.severity,
      message: finding.message,
      standard: run.standardId,
      reference: finding.ruleReference ?? ''
    });
  }

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Total Findings', key: 'total', width: 18 },
    { header: 'Errors', key: 'errors', width: 12 },
    { header: 'Warnings', key: 'warnings', width: 12 }
  ];
  summarySheet.addRow({
    total: run.summary.total,
    errors: run.summary.errors,
    warnings: run.summary.warnings
  });

  return workbook;
}
