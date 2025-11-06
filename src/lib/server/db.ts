import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const databasePath = join(dataDir, 'auth.db');

export const db = new Database(databasePath);
db.pragma('journal_mode = WAL');

db
  .prepare(
    `CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      email_verified INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )`
  )
  .run();

db
  .prepare(
    `CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    )`
  )
  .run();

db
  .prepare(
    `CREATE TABLE IF NOT EXISTS key (
      id TEXT PRIMARY KEY,
      hashed_password TEXT,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      primary_key INTEGER DEFAULT 0
    )`
  )
  .run();

db
  .prepare(
    `CREATE TABLE IF NOT EXISTS magic_token (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      user_id TEXT,
      expires_at INTEGER NOT NULL,
      metadata TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )`
  )
  .run();

db
  .prepare(
    `CREATE TABLE IF NOT EXISTS profile (
      user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
      name TEXT,
      preferences TEXT,
      updated_at INTEGER DEFAULT (strftime('%s','now'))
    )`
  )
  .run();
