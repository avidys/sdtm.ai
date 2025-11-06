import { db } from './db';

export interface Profile {
  user_id: string;
  name: string | null;
  preferences: string | null;
}

export const getProfile = (userId: string): Profile | null => {
  const profile = db.prepare('SELECT user_id, name, preferences FROM profile WHERE user_id = ?').get(userId) as
    | Profile
    | undefined;
  return profile ?? null;
};

export const upsertProfile = (userId: string, data: { name?: string | null; preferences?: string | null }) => {
  const payload = {
    name: data.name ?? null,
    preferences: data.preferences ?? null
  };

  db
    .prepare(
      `INSERT INTO profile (user_id, name, preferences, updated_at)
       VALUES (@user_id, @name, @preferences, strftime('%s','now'))
       ON CONFLICT(user_id) DO UPDATE SET
         name = excluded.name,
         preferences = excluded.preferences,
         updated_at = excluded.updated_at`
    )
    .run({ user_id: userId, ...payload });

  return getProfile(userId);
};
