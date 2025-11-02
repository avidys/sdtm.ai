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

// Get API base URL
function getApiBaseUrl(): string {
	const apiPort = import.meta.env.VITE_API_PORT || import.meta.env.PUBLIC_API_PORT || '8000';
	const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost';
	return `${backendUrl}:${apiPort}`;
}

/**
 * Run compliance check using Excel file (local API)
 */
export async function runComplianceCheckExcel({
	standard,
	dataset
}: ComplianceOptions): Promise<ComplianceRun> {
	const apiUrl = `${getApiBaseUrl()}/api/compliance/excel`;
	
	try {
		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				dataset_name: dataset.name,
				dataset_domain: dataset.domain,
				dataset_columns: dataset.columns,
				dataset_rows: dataset.rows,
				standard_id: standard.id
			})
		});
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ detail: response.statusText }));
			throw new Error(errorData.detail || `API error: ${response.statusText}`);
		}
		
		const apiResponse = await response.json();
		
		// Convert API response to ComplianceRun format
		const findings: ComplianceFinding[] = (apiResponse.findings || []).map((f: any) => ({
			id: uuidv4(),
			domain: f.domain || dataset.domain || 'Unknown',
			variable: f.variable,
			severity: f.severity || 'warning',
			message: f.message || '',
			ruleReference: f.ruleReference || '',
			standardId: standard.id
		}));
		
		return {
			id: uuidv4(),
			datasetName: dataset.name,
			standardId: standard.id,
			startedAt: new Date().toISOString(),
			completedAt: new Date().toISOString(),
			findings,
			summary: apiResponse.summary || { total: 0, errors: 0, warnings: 0 }
		};
	} catch (err) {
		console.error('Excel compliance check error:', err);
		throw err;
	}
}

/**
 * Run compliance check using OpenAI with PDF context (OpenAI API)
 */
export async function runComplianceCheckOpenAI({
	standard,
	dataset
}: ComplianceOptions): Promise<ComplianceRun> {
	const apiUrl = `${getApiBaseUrl()}/api/compliance/openai`;
	
	try {
		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				dataset_name: dataset.name,
				dataset_domain: dataset.domain,
				dataset_columns: dataset.columns,
				dataset_rows: dataset.rows,
				standard_id: standard.id
			})
		});
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ detail: response.statusText }));
			throw new Error(errorData.detail || `API error: ${response.statusText}`);
		}
		
		const apiResponse = await response.json();
		
		// Convert API response to ComplianceRun format
		const findings: ComplianceFinding[] = (apiResponse.findings || []).map((f: any) => ({
			id: uuidv4(),
			domain: f.domain || dataset.domain || 'Unknown',
			variable: f.variable,
			severity: f.severity || 'info',
			message: f.message || '',
			ruleReference: f.ruleReference || 'OpenAI analysis',
			standardId: standard.id
		}));
		
		return {
			id: uuidv4(),
			datasetName: dataset.name,
			standardId: standard.id,
			startedAt: new Date().toISOString(),
			completedAt: new Date().toISOString(),
			findings,
			summary: apiResponse.summary || { total: 0, errors: 0, warnings: 0 }
		};
	} catch (err) {
		console.error('OpenAI compliance check error:', err);
		throw err;
	}
}

/**
 * Run compliance check - combines both Excel and OpenAI checks
 */
export async function runComplianceCheckCombined({
	standard,
	dataset
}: ComplianceOptions): Promise<ComplianceRun> {
	// Run both checks in parallel
	const [excelResult, openaiResult] = await Promise.allSettled([
		runComplianceCheckExcel({ standard, dataset }),
		runComplianceCheckOpenAI({ standard, dataset })
	]);
	
	// Combine findings from both sources
	const allFindings: ComplianceFinding[] = [];
	
	if (excelResult.status === 'fulfilled') {
		allFindings.push(...excelResult.value.findings);
	}
	
	if (openaiResult.status === 'fulfilled') {
		allFindings.push(...openaiResult.value.findings);
	}
	
	// Remove duplicates (same variable + message)
	const uniqueFindings = new Map<string, ComplianceFinding>();
	for (const finding of allFindings) {
		const key = `${finding.variable || ''}-${finding.message}`;
		if (!uniqueFindings.has(key)) {
			uniqueFindings.set(key, finding);
		}
	}
	
	const summary = Array.from(uniqueFindings.values()).reduce(
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
		findings: Array.from(uniqueFindings.values()),
		summary
	};
}

/**
 * Legacy synchronous compliance check (kept for backward compatibility)
 * This runs client-side checks using the loaded standard definition
 */
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
