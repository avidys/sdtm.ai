import { Database as DuckDatabase } from 'duckdb';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import type { ParsedDataset, ComplianceRun } from '$lib/standards/types';

export interface StoredDataset {
  id: string;
  name: string;
  domain?: string;
  tableName: string;
  rowCount: number;
  columns: Record<string, string>;
  createdAt: string;
}

export interface StoredComplianceRun extends ComplianceRun {
  datasetId: string;
}

export class Database {
  private db: DuckDatabase;
  private datasets: Map<string, StoredDataset> = new Map();
  private runs: Map<string, StoredComplianceRun> = new Map();

  constructor(dbPath = './data/app.duckdb') {
    const dir = join(dbPath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.db = new DuckDatabase(dbPath);
    const connection = this.db.connect();
    connection.run(`CREATE TABLE IF NOT EXISTS metadata_datasets (
      id VARCHAR PRIMARY KEY,
      name VARCHAR,
      domain VARCHAR,
      table_name VARCHAR,
      row_count BIGINT,
      columns JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    connection.run(`CREATE TABLE IF NOT EXISTS metadata_runs (
      id VARCHAR PRIMARY KEY,
      dataset_id VARCHAR,
      dataset_name VARCHAR,
      standard_id VARCHAR,
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      findings JSON,
      summary JSON
    )`);

    const datasets = connection.all('SELECT * FROM metadata_datasets');
    for (const row of datasets) {
      this.datasets.set(row.id, {
        id: row.id,
        name: row.name,
        domain: row.domain ?? undefined,
        tableName: row.table_name,
        rowCount: Number(row.row_count ?? 0),
        columns: typeof row.columns === 'string' ? JSON.parse(row.columns) : row.columns ?? {},
        createdAt: row.created_at ?? new Date().toISOString()
      });
    }

    const runs = connection.all('SELECT * FROM metadata_runs');
    for (const row of runs) {
      this.runs.set(row.id, {
        id: row.id,
        datasetId: row.dataset_id,
        datasetName: row.dataset_name ?? this.datasets.get(row.dataset_id)?.name ?? row.dataset_id,
        standardId: row.standard_id,
        startedAt: row.started_at,
        completedAt: row.completed_at ?? undefined,
        findings: typeof row.findings === 'string' ? JSON.parse(row.findings) : row.findings ?? [],
        summary: typeof row.summary === 'string' ? JSON.parse(row.summary) : row.summary ?? { total: 0, errors: 0, warnings: 0 }
      });
    }

    connection.close();
  }

  private get connection() {
    return this.db.connect();
  }

  async upsertDataset(dataset: ParsedDataset): Promise<StoredDataset> {
    const id = uuidv4();
    const tableName = `dataset_${id.replace(/-/g, '_')}`;
    const conn = this.connection;
    try {
      const columns = Object.entries(dataset.columns)
        .map(([name, type]) => `"${name}" ${this.translateType(type)}`)
        .join(', ');
      conn.run(`CREATE TABLE ${tableName} (${columns})`);

      const placeholders = Object.keys(dataset.columns)
        .map(() => '?')
        .join(', ');
      const insert = conn.prepare(
        `INSERT INTO ${tableName} VALUES (${placeholders})`
      );
      for (const row of dataset.rows) {
        insert.run(
          Object.keys(dataset.columns).map((key) => row[key] ?? null)
        );
      }
      insert.finalize();

      const record: StoredDataset = {
        id,
        name: dataset.name,
        domain: dataset.domain,
        tableName,
        rowCount: dataset.rowCount,
        columns: dataset.columns,
        createdAt: new Date().toISOString()
      };
      this.datasets.set(id, record);
      conn.run(
        `INSERT INTO metadata_datasets (id, name, domain, table_name, row_count, columns) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.name,
          record.domain ?? null,
          record.tableName,
          record.rowCount,
          JSON.stringify(record.columns)
        ]
      );
      return record;
    } finally {
      conn.close();
    }
  }

  listDatasets(): StoredDataset[] {
    return Array.from(this.datasets.values());
  }

  getDataset(id: string): StoredDataset | undefined {
    if (this.datasets.has(id)) {
      return this.datasets.get(id);
    }
    const conn = this.connection;
    try {
      const rows = conn.all('SELECT * FROM metadata_datasets WHERE id = ?', [id]);
      if (rows.length === 0) return undefined;
      const row = rows[0] as any;
      const dataset: StoredDataset = {
        id: row.id,
        name: row.name,
        domain: row.domain ?? undefined,
        tableName: row.table_name,
        rowCount: Number(row.row_count ?? 0),
        columns: typeof row.columns === 'string' ? JSON.parse(row.columns) : row.columns ?? {},
        createdAt: row.created_at ?? new Date().toISOString()
      };
      this.datasets.set(id, dataset);
      return dataset;
    } finally {
      conn.close();
    }
  }

  listRuns(datasetId?: string): StoredComplianceRun[] {
    const runs = Array.from(this.runs.values());
    if (!datasetId) return runs;
    return runs.filter((run) => run.datasetId === datasetId);
  }

  getRun(id: string): StoredComplianceRun | undefined {
    if (this.runs.has(id)) {
      return this.runs.get(id);
    }
    const conn = this.connection;
    try {
      const rows = conn.all('SELECT * FROM metadata_runs WHERE id = ?', [id]);
      if (rows.length === 0) return undefined;
      const row = rows[0] as any;
      const run: StoredComplianceRun = {
        id: row.id,
        datasetId: row.dataset_id,
        datasetName: row.dataset_name ?? this.datasets.get(row.dataset_id)?.name ?? row.dataset_id,
        standardId: row.standard_id,
        startedAt: row.started_at,
        completedAt: row.completed_at ?? undefined,
        findings: typeof row.findings === 'string' ? JSON.parse(row.findings) : row.findings ?? [],
        summary: typeof row.summary === 'string' ? JSON.parse(row.summary) : row.summary ?? { total: 0, errors: 0, warnings: 0 }
      };
      this.runs.set(id, run);
      return run;
    } finally {
      conn.close();
    }
  }

  saveRun(run: StoredComplianceRun) {
    this.runs.set(run.id, run);
    const conn = this.connection;
    try {
      conn.run(
        `INSERT INTO metadata_runs (id, dataset_id, dataset_name, standard_id, started_at, completed_at, findings, summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          run.id,
          run.datasetId,
          run.datasetName,
          run.standardId,
          run.startedAt,
          run.completedAt ?? null,
          JSON.stringify(run.findings),
          JSON.stringify(run.summary)
        ]
      );
    } finally {
      conn.close();
    }
  }

  private translateType(type: string): string {
    const normalized = type.toLowerCase();
    if (normalized.includes('int')) return 'INTEGER';
    if (normalized.includes('double') || normalized.includes('float')) return 'DOUBLE';
    if (normalized.includes('date')) return 'TIMESTAMP';
    if (normalized.includes('bool')) return 'BOOLEAN';
    return 'VARCHAR';
  }
}

export function createDatabase() {
  return new Database(process.env.SDTM_AI_DUCKDB_PATH ?? './data/app.duckdb');
}
