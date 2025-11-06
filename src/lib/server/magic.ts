import { randomBytes } from 'node:crypto';
import { db } from './db';

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
