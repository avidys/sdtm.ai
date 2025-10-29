import Papa from 'papaparse';
import pkg from 'parquetjs-lite';
import { basename, extname, join } from 'node:path';
import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import type { ParsedDataset } from '$lib/standards/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { openBuffer }: { openBuffer: (buffer: Buffer) => Promise<any> } = pkg as any;

// Dynamic import for xport-js to avoid SSR issues
async function getXportLibrary() {
  const xportModule = await import('xport-js');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (xportModule as any).default || xportModule;
}

function normalizeName(name: string) {
  return basename(name).replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
}

export async function parseDatasetFile(file: File): Promise<ParsedDataset> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = extname(file.name).toLowerCase();

    if (extension === '.csv' || extension === '.txt') {
      return parseCsv(buffer, file.name);
    }
    if (extension === '.parquet' || extension === '.pq') {
      return parseParquet(buffer, file.name);
    }
    if (extension === '.sas7bdat') {
      throw new Error('SAS file support is temporarily disabled');
      // return parseSas(buffer, file.name);
    }
    if (extension === '.xpt') {
      return parseXpt(buffer, file.name);
    }

    throw new Error(`Unsupported file format for ${file.name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to process file ${file.name}: ${errorMessage}`);
  }
}

function guessColumnTypes(rows: Record<string, unknown>[]): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Process all rows to capture all possible columns (not just first 10)
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      // If we already have this column mapped, don't override
      if (result[key]) continue;
      
      // Determine type based on the value
      if (value === null || value === undefined) {
        result[key] = 'string'; // Default for null/undefined
      } else if (typeof value === 'number') {
        result[key] = Number.isInteger(value) ? 'integer' : 'double';
      } else if (value instanceof Date) {
        result[key] = 'date';
      } else if (typeof value === 'boolean') {
        result[key] = 'boolean';
      } else {
        result[key] = 'string';
      }
    }
  }
  return result;
}

async function parseCsv(buffer: Buffer, filename: string): Promise<ParsedDataset> {
  const text = buffer.toString('utf-8');
  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: true
  });
  if (parsed.errors.length) {
    throw new Error(parsed.errors.map((error) => error.message).join(', '));
  }
  const rows = parsed.data.filter((row) => Object.keys(row).some((key) => row[key] !== undefined));
  const columns = guessColumnTypes(rows);
  return {
    name: normalizeName(filename),
    domain: normalizeName(filename).slice(0, 2),
    rowCount: rows.length,
    columns,
    rows
  };
}

async function parseParquet(buffer: Buffer, filename: string): Promise<ParsedDataset> {
  try {
    const reader = await openBuffer(buffer);
    const cursor = reader.getCursor();
    const rows: Record<string, unknown>[] = [];
    let row: Record<string, unknown> | null;
    while ((row = await cursor.next())) {
      rows.push(row);
    }
    await reader.close();
    const schema = reader.metadata.schema;
    const columns: Record<string, string> = {};
    for (const column of schema) {
      if (!column.path_in_schema || column.path_in_schema.length === 0) continue;
      columns[column.path_in_schema[0]] = column.converted_type ?? column.logicalType ?? 'string';
    }
    return {
      name: normalizeName(filename),
      domain: normalizeName(filename).slice(0, 2),
      rowCount: rows.length,
      columns: Object.keys(columns).length ? columns : guessColumnTypes(rows),
      rows
    };
  } catch (error) {
    throw new Error(`Failed to parse parquet file ${filename}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function parseXpt(buffer: Buffer, filename: string): Promise<ParsedDataset> {
  // Write buffer to temporary file (xport-js requires a file path)
  const tempPath = join(tmpdir(), `xpt-${Date.now()}-${basename(filename)}`);
  await writeFile(tempPath, buffer);
  
  try {
    // Dynamically import Library to avoid SSR issues
    const Library = await getXportLibrary();
    // Use xport-js library to parse XPT files
    const xport = new Library(tempPath);
  
    // Get metadata first
    await xport.getMetadata();
    
    // Get the dataset records as objects
    const rows: Record<string, unknown>[] = [];
    for await (const record of xport.read({ rowFormat: 'object' })) {
      rows.push(record as Record<string, unknown>);
    }

    if (rows.length === 0) {
      throw new Error('No rows found in XPT file');
    }

    // Get columns from all rows
    const columns = guessColumnTypes(rows);
    
    // Clean up temp file
    await unlink(tempPath).catch(() => {
      // Ignore cleanup errors
    });
    
    return {
      name: normalizeName(filename),
      domain: normalizeName(filename).slice(0, 2),
      rowCount: rows.length,
      columns,
      rows
    };
  } catch (error) {
    // Clean up temp file on error
    await unlink(tempPath).catch(() => {
      // Ignore cleanup errors
    });
    throw error;
  }
}
