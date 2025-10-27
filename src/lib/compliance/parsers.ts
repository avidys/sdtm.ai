import Papa from 'papaparse';
import { ParquetReader } from 'parquetjs-lite';
import SAS7BDAT from 'sas7bdat';
import type { DatasetFormat, ParsedDataset } from './types';

const textDecoder = new TextDecoder();

export function inferFormat(filename: string): DatasetFormat {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.parquet') || lower.endsWith('.pq')) return 'parquet';
  if (lower.endsWith('.sas7bdat')) return 'sas7bdat';
  throw new Error(`Unsupported file format for ${filename}`);
}

function inferDomain(filename: string): string {
  return filename.split('.')[0]?.toUpperCase() ?? filename.toUpperCase();
}

export async function parseDataset(
  filename: string,
  format: DatasetFormat,
  contents: Uint8Array
): Promise<ParsedDataset> {
  switch (format) {
    case 'csv': {
      const text = textDecoder.decode(contents);
      const parsed = Papa.parse<Record<string, unknown>>(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });
      return {
        name: filename,
        domain: inferDomain(filename),
        rows: parsed.data,
        columns: parsed.meta.fields ?? []
      };
    }
    case 'parquet': {
      const reader = await ParquetReader.openBuffer(Buffer.from(contents));
      const cursor = reader.getCursor();
      const rows: Record<string, unknown>[] = [];
      let row: Record<string, unknown> | null = null;
      while ((row = await cursor.next())) {
        rows.push(row);
      }
      await reader.close();
      const columns = Object.keys(rows[0] ?? {});
      return {
        name: filename,
        domain: inferDomain(filename),
        rows,
        columns
      };
    }
    case 'sas7bdat': {
      const sas = new SAS7BDAT(Buffer.from(contents));
      const rows: Record<string, unknown>[] = [];
      const columns: string[] = [];
      for await (const row of sas) {
        if (columns.length === 0) {
          columns.push(...Object.keys(row));
        }
        rows.push(row as Record<string, unknown>);
      }
      return {
        name: filename,
        domain: inferDomain(filename),
        rows,
        columns
      };
    }
    default: {
      const exhaustive: never = format;
      throw new Error(`Unsupported format ${exhaustive}`);
    }
  }
}
