import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import XLSX from 'xlsx';
import type { StandardDefinition } from './types';
import { getStandardSummary } from './catalog';

const cache = new Map<string, StandardDefinition>();

async function loadWorkbook(file: string) {
  const buffer = await readFile(resolve(file));
  return XLSX.read(buffer, { type: 'buffer' });
}

function parseSDTMIG(workbook: XLSX.WorkBook, standardId: string): StandardDefinition {
  const summary = getStandardSummary(standardId);
  if (!summary) {
    throw new Error(`Unknown standard id ${standardId}`);
  }

  const domainsSheet = workbook.Sheets['Domains'] ?? workbook.Sheets['Domain Metadata'];
  const variablesSheet = workbook.Sheets['Variables'] ?? workbook.Sheets['Variable Metadata'];
  const domains: StandardDefinition['domains'] = [];
  const variables: StandardDefinition['variables'] = [];

  if (domainsSheet) {
    const rows = XLSX.utils.sheet_to_json(domainsSheet, { defval: null });
    for (const row of rows as Record<string, unknown>[]) {
      const domain = String(row['Domain'] ?? row['DOMAIN'] ?? '');
      if (!domain) continue;
      domains.push({
        domain,
        structure: (row['Structure'] ?? row['STRUCTURE']) as string | undefined,
        keyVariables: ((row['Key Variables'] ?? row['KEYVARIABLES']) as string | undefined)
          ?.split(/[,;]+/)
          .map((value) => value.trim())
          .filter(Boolean),
        role: (row['Role'] ?? row['ROLE']) as string | undefined,
        class: (row['Class'] ?? row['CLASS']) as string | undefined,
        comment: (row['Description'] ?? row['Description / Notes'] ?? row['COMMENTS']) as string | undefined
      });
    }
  }

  if (variablesSheet) {
    const rows = XLSX.utils.sheet_to_json(variablesSheet, { defval: null });
    for (const row of rows as Record<string, unknown>[]) {
      const domain = String(row['Domain'] ?? row['DOMAIN'] ?? '');
      const variable = String(row['Variable Name'] ?? row['VARIABLE'] ?? '');
      if (!domain || !variable) continue;
      const controlled = (row['Controlled Terms, Codelist'] ?? row['Codelist'] ?? row['CT']) as string | undefined;
      variables.push({
        domain,
        variable,
        datatype: (row['Type'] ?? row['TYPE']) as string | undefined,
        required: String(row['Core'] ?? row['CORE'] ?? '').toUpperCase() === 'REQ',
        length: row['Length'] ? Number(row['Length']) : undefined,
        controlledTerminology: controlled
          ? controlled
              .split(/[,;]+/)
              .map((value) => value.trim())
              .filter(Boolean)
          : undefined,
        origin: (row['Origin'] ?? row['ORIGIN']) as string | undefined,
        comment: (row['Description'] ?? row['Comment'] ?? row['COMMENTS']) as string | undefined
      });
    }
  }

  return {
    ...summary,
    domains,
    variables
  };
}

async function loadControlledTerminology(standardId: string): Promise<StandardDefinition> {
  const summary = getStandardSummary(standardId);
  if (!summary) throw new Error(`Unknown standard ${standardId}`);
  const workbook = await loadWorkbook('SDTM_CT_2025-03-28.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  const terms = rows as Record<string, unknown>[];
  const variables = terms
    .filter((row) => row['Code'] && row['Codelist'])
    .map((row) => ({
      domain: String(row['Codelist']),
      variable: String(row['Code']),
      comment: (row['Codelist Code'] ?? row['Decode']) as string | undefined,
      controlledTerminology: [String(row['Decode'] ?? row['Code Meaning'] ?? '')]
    }));
  return {
    ...summary,
    domains: [],
    variables
  };
}

export async function loadStandardDefinition(id: string): Promise<StandardDefinition> {
  if (cache.has(id)) {
    return cache.get(id)!;
  }

  let definition: StandardDefinition;
  switch (id) {
    case 'sdtmig-3-4': {
      const workbook = await loadWorkbook('SDTMIG_v3.4.xlsx');
      definition = parseSDTMIG(workbook, id);
      break;
    }
    case 'terminology-2025-03-28': {
      definition = await loadControlledTerminology(id);
      break;
    }
    default: {
      const summary = getStandardSummary(id);
      if (!summary) {
        throw new Error(`Unsupported standard ${id}`);
      }
      definition = {
        ...summary,
        domains: [],
        variables: []
      };
    }
  }

  cache.set(id, definition);
  return definition;
}
