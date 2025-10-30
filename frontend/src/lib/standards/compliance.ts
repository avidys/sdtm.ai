import { v4 as uuidv4 } from 'uuid';
import type {
  ComplianceFinding,
  ComplianceRun,
  ParsedDataset,
  StandardDefinition
} from './types';

interface ComplianceOptions {
  standard: StandardDefinition;
  dataset: ParsedDataset;
}

export function runComplianceCheck({
  standard,
  dataset
}: ComplianceOptions): ComplianceRun {
  const findings: ComplianceFinding[] = [];

  const domainMetadata = standard.domains.find(
    (domain) => domain.domain.toUpperCase() === (dataset.domain ?? '').toUpperCase()
  );

  if (!domainMetadata) {
    findings.push({
      id: uuidv4(),
      domain: dataset.domain ?? 'Unknown',
      severity: 'error',
      message: `Dataset domain ${(dataset.domain ?? dataset.name)} is not defined in ${standard.name} v${standard.version}.`,
      ruleReference: `${standard.name} v${standard.version} domain catalog`,
      standardId: standard.id
    });
  } else if (domainMetadata.keyVariables) {
    for (const keyVariable of domainMetadata.keyVariables) {
      if (!(keyVariable in dataset.columns)) {
        findings.push({
          id: uuidv4(),
          domain: domainMetadata.domain,
          variable: keyVariable,
          severity: 'error',
          message: `Key variable ${keyVariable} is missing from dataset ${dataset.name}.`,
          ruleReference: `Key variables for ${domainMetadata.domain}`,
          standardId: standard.id
        });
      }
    }
  }

  const variableRules = standard.variables.filter(
    (rule) => rule.domain.toUpperCase() === (dataset.domain ?? '').toUpperCase()
  );

  for (const rule of variableRules) {
    const columnType = dataset.columns[rule.variable];
    if (!columnType) {
      if (rule.required) {
        findings.push({
          id: uuidv4(),
          domain: rule.domain,
          variable: rule.variable,
          severity: 'error',
          message: `Required variable ${rule.variable} is missing.`,
          ruleReference: `${rule.domain}.${rule.variable} core requirement`,
          standardId: standard.id
        });
      } else {
        findings.push({
          id: uuidv4(),
          domain: rule.domain,
          variable: rule.variable,
          severity: 'warning',
          message: `Expected variable ${rule.variable} is not present.`,
          ruleReference: `${rule.domain}.${rule.variable} optional variable`,
          standardId: standard.id
        });
      }
      continue;
    }

    if (rule.datatype) {
      const normalizedActual = columnType.toLowerCase();
      const normalizedExpected = rule.datatype.toLowerCase();
      if (!normalizedActual.includes(normalizedExpected)) {
        findings.push({
          id: uuidv4(),
          domain: rule.domain,
          variable: rule.variable,
          severity: 'warning',
          message: `Variable ${rule.variable} is ${columnType} but expected ${rule.datatype}.`,
          ruleReference: `${rule.domain}.${rule.variable} datatype`,
          standardId: standard.id
        });
      }
    }

    if (rule.controlledTerminology && rule.controlledTerminology.length > 0) {
      const invalidValues = new Set<string>();
      for (const row of dataset.rows) {
        const value = row[rule.variable];
        if (value === null || value === undefined || value === '') continue;
        if (!rule.controlledTerminology.includes(String(value))) {
          invalidValues.add(String(value));
        }
      }
      if (invalidValues.size) {
        findings.push({
          id: uuidv4(),
          domain: rule.domain,
          variable: rule.variable,
          severity: 'error',
          message: `Found ${invalidValues.size} value(s) not in controlled terminology: ${Array.from(invalidValues).join(', ')}.`,
          ruleReference: `${rule.domain}.${rule.variable} controlled terminology`,
          standardId: standard.id
        });
      }
    }
  }

  const summary = findings.reduce(
    (acc, finding) => {
      acc.total += 1;
      if (finding.severity === 'error') acc.errors += 1;
      if (finding.severity === 'warning') acc.warnings += 1;
      return acc;
    },
    { total: 0, errors: 0, warnings: 0 }
  );

  return {
    id: uuidv4(),
    datasetName: dataset.name,
    standardId: standard.id,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    findings,
    summary
  };
}
