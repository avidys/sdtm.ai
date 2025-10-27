import type { ComplianceRule, Finding, ParsedDataset } from './types';

function requireDatasetRule(
  id: string,
  datasetName: string,
  description: string,
  reference: string,
  severity: Finding['severity'] = 'error'
): ComplianceRule {
  return {
    id,
    title: `${datasetName} domain must be present`,
    severity,
    standardId: 'sdtmig-v4-3',
    apply: (datasets) => {
      const exists = datasets.some((d) => d.domain === datasetName);
      return exists
        ? []
        : [
            {
              id,
              dataset: datasetName,
              variable: null,
              severity,
              message: description,
              reference
            }
          ];
    }
  };
}

function requireVariablesRule(
  id: string,
  datasetName: string,
  variables: string[],
  reference: string
): ComplianceRule {
  return {
    id,
    title: `${datasetName} required variables`,
    severity: 'error',
    standardId: 'sdtmig-v4-3',
    apply: (datasets) => {
      const dataset = datasets.find((d) => d.domain === datasetName);
      if (!dataset) return [];
      const missing = variables.filter((v) => !dataset.columns.includes(v));
      if (missing.length === 0) return [];
      return [
        {
          id,
          dataset: datasetName,
          variable: null,
          severity: 'error',
          message: `Missing required variables: ${missing.join(', ')}`,
          reference,
          recommendation: 'Ensure the domain contains all mandatory columns as per SDTMIG 4.3.'
        }
      ];
    }
  };
}

function uniqueKeyRule(
  id: string,
  datasetName: string,
  keyVariables: string[],
  reference: string
): ComplianceRule {
  return {
    id,
    title: `${datasetName} uniqueness`,
    severity: 'error',
    standardId: 'sdtmig-v4-3',
    apply: (datasets) => {
      const dataset = datasets.find((d) => d.domain === datasetName);
      if (!dataset) return [];
      const seen = new Set<string>();
      const duplicates: number[] = [];
      dataset.rows.forEach((row, index) => {
        const key = keyVariables.map((v) => row[v]).join('|');
        if (seen.has(key)) {
          duplicates.push(index + 1);
        }
        seen.add(key);
      });
      if (duplicates.length === 0) return [];
      return [
        {
          id,
          dataset: datasetName,
          variable: keyVariables.join(','),
          severity: 'error',
          message: `Duplicate records detected for keys ${keyVariables.join(', ')} at rows ${duplicates.join(', ')}`,
          reference,
          recommendation: 'Ensure the identifying variables uniquely identify records.'
        }
      ];
    }
  };
}

function controlledTerminologyRule(
  id: string,
  datasetName: string,
  variable: string,
  allowed: string[],
  reference: string
): ComplianceRule {
  return {
    id,
    title: `${datasetName}.${variable} controlled terminology`,
    severity: 'warning',
    standardId: 'sdtmig-v4-3',
    apply: (datasets) => {
      const dataset = datasets.find((d) => d.domain === datasetName);
      if (!dataset) return [];
      const invalid = dataset.rows
        .map((row, idx) => ({ value: row[variable], row: idx + 1 }))
        .filter(({ value }) => value != null && !allowed.includes(String(value)));
      if (invalid.length === 0) return [];
      return [
        {
          id,
          dataset: datasetName,
          variable,
          severity: 'warning',
          message: `Found ${invalid.length} values outside of ${allowed.join(', ')}`,
          reference,
          recommendation: 'Align values with the published controlled terminology.'
        }
      ];
    }
  };
}

function uppercaseVariablesRule(id: string, reference: string): ComplianceRule {
  return {
    id,
    title: 'Variable names must be uppercase',
    severity: 'info',
    standardId: 'sdtmig-v4-3',
    apply: (datasets) => {
      const findings: Finding[] = [];
      datasets.forEach((dataset) => {
        const violations = dataset.columns.filter((col) => col !== col.toUpperCase());
        if (violations.length > 0) {
          findings.push({
            id,
            dataset: dataset.domain,
            variable: violations.join(', '),
            severity: 'info',
            message: `Variables should be uppercase: ${violations.join(', ')}`,
            reference,
            recommendation: 'Rename columns to their uppercase SDTM equivalents.'
          });
        }
      });
      return findings;
    }
  };
}

export const sdtmig43Rules: ComplianceRule[] = [
  requireDatasetRule(
    'SDTMIG43-DM-001',
    'DM',
    'Demographics domain is required for all SDTM submissions.',
    'SDTMIG 4.3 §5'
  ),
  requireVariablesRule(
    'SDTMIG43-DM-002',
    'DM',
    ['STUDYID', 'USUBJID', 'ARM'],
    'SDTMIG 4.3 §5.2'
  ),
  uniqueKeyRule(
    'SDTMIG43-DM-003',
    'DM',
    ['STUDYID', 'USUBJID'],
    'SDTMIG 4.3 §5.2'
  ),
  requireDatasetRule(
    'SDTMIG43-AE-001',
    'AE',
    'Adverse Events domain must be present when AE data are collected.',
    'SDTMIG 4.3 §7'
  ),
  requireVariablesRule(
    'SDTMIG43-AE-002',
    'AE',
    ['AEDECOD', 'AETERM', 'AESTDTC'],
    'SDTMIG 4.3 §7.4'
  ),
  controlledTerminologyRule(
    'SDTMIG43-DM-004',
    'DM',
    'SEX',
    ['M', 'F', 'U'],
    'SDTMIG 4.3 Controlled Terminology'
  ),
  uppercaseVariablesRule('SDTMIG43-GEN-001', 'SDTMIG 4.3 General Assumptions')
];

export const ruleRegistry: Record<string, ComplianceRule[]> = {
  'sdtmig-v4-3': sdtmig43Rules,
  'sdtmig-v3-4': sdtmig43Rules,
  'sdtm-v2-0': [],
  'ct-2025-03': [],
  'define-xml-v2': []
};
