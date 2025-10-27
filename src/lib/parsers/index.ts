import Papa from 'papaparse';
import { ParquetReader } from 'parquetjs-lite';
import { SasFile } from 'sas7bdat';
import { basename, extname } from 'node:path';
import type { ParsedDataset } from '$lib/standards/types';

function normalizeName(name: string) {
  return basename(name).replace(/\s+/g, '_').replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
}

export async function parseDatasetFile(file: File): Promise<ParsedDataset> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = extname(file.name).toLowerCase();

  if (extension === '.csv' || extension === '.txt') {
    return parseCsv(buffer, file.name);
  }
  if (extension === '.parquet' || extension === '.pq') {
    return parseParquet(buffer, file.name);
  }
  if (extension === '.sas7bdat') {
    return parseSas(buffer, file.name);
  }

  throw new Error(`Unsupported file format for ${file.name}`);
}

function guessColumnTypes(rows: Record<string, unknown>[]) {
  const result: Record<string, string> = {};
  const sample = rows.slice(0, 10);
  for (const row of sample) {
    for (const [key, value] of Object.entries(row)) {
      if (result[key]) continue;
      if (typeof value === 'number') {
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
  const reader = await ParquetReader.openBuffer(buffer);
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
}

async function parseSas(buffer: Buffer, filename: string): Promise<ParsedDataset> {
  const file = new SasFile(buffer);
  const rows: Record<string, unknown>[] = [];
  await new Promise<void>((resolve, reject) => {
    file
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve())
      .on('error', (error) => reject(error));
    (file as unknown as { read: () => void }).read();
  });
  const columns = guessColumnTypes(rows);
  return {
    name: normalizeName(filename),
    domain: normalizeName(filename).slice(0, 2),
    rowCount: rows.length,
    columns,
    rows
  };
}
