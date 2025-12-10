import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
//import { db } from '$lib/server/database';

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
  
export interface MagicTokenRecord {
  token: string;
  email: string;
  user_id: string | null;
  expires_at: number;
  metadata: string | null;
}

export const createMagicToken = (
  email: string,
  userId: string | null,
  expiresInSeconds: number,
  metadata: Record<string, unknown> | null = null
) => {
  const token = randomBytes(32).toString('hex');
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  db.prepare('DELETE FROM magic_token WHERE email = ?').run(email.toLowerCase());
  db
    .prepare(
      'INSERT INTO magic_token (token, email, user_id, expires_at, metadata) VALUES (?, ?, ?, ?, ?)' 
    )
    .run(token, email.toLowerCase(), userId, expiresAt, metadata ? JSON.stringify(metadata) : null);

  return {
    token,
    expiresAt
  };
};

export const consumeMagicToken = (token: string): MagicTokenRecord | null => {
  const record = db.prepare('SELECT token, email, user_id, expires_at, metadata FROM magic_token WHERE token = ?').get(token) as
    | MagicTokenRecord
    | undefined;

  if (!record) {
    return null;
  }

  if (record.expires_at < Math.floor(Date.now() / 1000)) {
    db.prepare('DELETE FROM magic_token WHERE token = ?').run(token);
    return null;
  }

  db.prepare('DELETE FROM magic_token WHERE token = ?').run(token);
  return record;
};