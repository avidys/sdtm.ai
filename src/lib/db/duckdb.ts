import duckdb from 'duckdb';
import type { ParsedDataset } from '$lib/compliance/types';

type DuckDBDatabase = duckdb.Database;

type DuckDBConnection = duckdb.Connection;

export function createDuckDB(path = ':memory:'): DuckDBConnection {
  const db = new duckdb.Database(path);
  return db.connect();
}

function run(connection: DuckDBConnection, sql: string, params: unknown[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    connection.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function inferDuckType(value: unknown): string {
  if (value == null) return 'VARCHAR';
  if (typeof value === 'number') return Number.isInteger(value) ? 'BIGINT' : 'DOUBLE';
  if (value instanceof Date) return 'TIMESTAMP';
  const str = String(value);
  if (!Number.isNaN(Number(str)) && str.trim() !== '') {
    return str.includes('.') ? 'DOUBLE' : 'BIGINT';
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return 'TIMESTAMP';
  }
  return 'VARCHAR';
}

export async function stageDatasets(
  connection: DuckDBConnection,
  datasets: ParsedDataset[]
): Promise<void> {
  for (const dataset of datasets) {
    const tableName = dataset.domain;
    const columns = dataset.columns.length > 0 ? dataset.columns : Object.keys(dataset.rows[0] ?? {});
    const columnDefs = columns
      .map((col) => `"${col}" ${inferDuckType(dataset.rows[0]?.[col])}`)
      .join(', ');
    await run(connection, `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnDefs || 'dummy INTEGER'});`);

    if (dataset.rows.length === 0) continue;
    const placeholders = columns.map(() => '?').join(', ');
    const insert = connection.prepare(
      `INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders})`
    );
    for (const row of dataset.rows) {
      insert.run(columns.map((c) => row[c] ?? null));
    }
    insert.finalize();
  }
}

export function closeDuckDB(connection: duckdb.Connection) {
  connection.close();
}
