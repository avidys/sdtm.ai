export type DatasetFormat = 'csv' | 'sas7bdat' | 'parquet';

export interface DatasetDescriptor {
  name: string;
  domain: string;
  format: DatasetFormat;
  rowCount: number;
  columnCount: number;
}

export interface VariableDescriptor {
  dataset: string;
  name: string;
  type: string;
  length?: number;
  label?: string;
  required?: boolean;
}

export interface Finding {
  id: string;
  dataset: string | null;
  variable: string | null;
  severity: 'error' | 'warning' | 'info';
  message: string;
  recommendation?: string;
  reference?: string;
}

export interface ComplianceRunSummary {
  startedAt: string;
  standardId: string;
  datasets: DatasetDescriptor[];
  findings: Finding[];
  metadata: Record<string, unknown>;
}

export interface ParsedDataset {
  name: string;
  domain: string;
  rows: Record<string, unknown>[];
  columns: string[];
}

export interface ComplianceRule {
  id: string;
  title: string;
  severity: 'error' | 'warning' | 'info';
  standardId: string;
  apply: (datasets: ParsedDataset[]) => Finding[];
}
