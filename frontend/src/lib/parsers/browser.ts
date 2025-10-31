import Papa from 'papaparse';
import type { ParsedDataset } from '$lib/standards/types';

/**
 * Browser-compatible file parser
 * Currently supports: CSV, TXT
 * Note: XPT and Parquet parsing requires server-side processing
 */

function normalizeName(name: string): string {
  return name
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();
}

function getExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
}

function guessColumnTypes(rows: Record<string, unknown>[]): Record<string, string> {
  const result: Record<string, string> = {};
  
  if (rows.length === 0) return result;
  
  // Get all column names from first row
  const columns = Object.keys(rows[0]);
  
  for (const col of columns) {
    let type = 'string';
    
    // Check a few rows to determine type
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const value = rows[i][col];
      
      if (value === null || value === undefined || value === '') {
        continue;
      }
      
      if (typeof value === 'number') {
        type = Number.isInteger(value) ? 'integer' : 'double';
        break;
      } else if (value instanceof Date) {
        type = 'date';
        break;
      } else if (typeof value === 'boolean') {
        type = 'boolean';
        break;
      }
    }
    
    result[col] = type;
  }
  
  return result;
}

async function parseCsv(text: string, filename: string): Promise<ParsedDataset> {
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: true
  });
  
  if (parsed.errors.length) {
    throw new Error(parsed.errors.map((error) => error.message).join(', '));
  }
  
  const rows = parsed.data.filter((row) => 
    Object.keys(row).some((key) => row[key] !== undefined && row[key] !== '')
  );
  
  if (rows.length === 0) {
    throw new Error('No data rows found in CSV file');
  }
  
  const columns = guessColumnTypes(rows);
  
  return {
    name: normalizeName(filename),
    domain: normalizeName(filename).slice(0, 2),
    rowCount: rows.length,
    columns,
    rows
  };
}

export async function parseDatasetFile(file: File): Promise<ParsedDataset> {
  const extension = getExtension(file.name);
  
  try {
    // CSV and TXT files - parse in browser
    if (extension === 'csv' || extension === 'txt') {
      const text = await file.text();
      return parseCsv(text, file.name);
    }
    
    // XPT files - require server-side processing
    if (extension === 'xpt') {
      throw new Error(
        'SAS XPT files require server-side processing. ' +
        'Please use the server-side upload feature or convert to CSV first.'
      );
    }
    
    // Parquet files - require server-side processing
    if (extension === 'parquet' || extension === 'pq') {
      throw new Error(
        'Parquet files require server-side processing. ' +
        'Please use the server-side upload feature or convert to CSV first.'
      );
    }
    
    throw new Error(
      `Unsupported file format: .${extension}. ` +
      'Supported formats: CSV, TXT'
    );
    
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to process file ${file.name}: ${String(error)}`);
  }
}

