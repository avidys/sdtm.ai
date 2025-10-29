export interface StandardSummary {
  id: string;
  name: string;
  version: string;
  group: 'SDTM' | 'SDTMIG' | 'DefineXML' | 'Terminology';
  description: string;
  source?: string;
}

export interface VariableRule {
  domain: string;
  variable: string;
  datatype?: string;
  required?: boolean;
  length?: number;
  controlledTerminology?: string[];
  origin?: string;
  comment?: string;
}

export interface DomainRule {
  domain: string;
  structure?: string;
  keyVariables?: string[];
  role?: string;
  class?: string;
  comment?: string;
}

export interface StandardDefinition extends StandardSummary {
  domains: DomainRule[];
  variables: VariableRule[];
}

export type FindingSeverity = 'info' | 'warning' | 'error';

export interface ComplianceFinding {
  id: string;
  domain: string;
  variable?: string;
  severity: FindingSeverity;
  message: string;
  ruleReference?: string;
  standardId: string;
}

export interface ComplianceRun {
  id: string;
  datasetName: string;
  standardId: string;
  startedAt: string;
  completedAt?: string;
  findings: ComplianceFinding[];
  summary: {
    total: number;
    errors: number;
    warnings: number;
  };
}

export interface ParsedDataset {
  name: string;
  domain?: string;
  rowCount: number;
  columns: Record<string, string>;
  rows: Record<string, unknown>[];
}
