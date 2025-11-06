import { dev } from '$app/environment';
import { sqliteAdapter } from '@lucia-auth/adapter-sqlite';
import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import type { Session, User } from 'lucia';
import { db } from './db';

const adapter = sqliteAdapter(db, {
  user: 'user',
  session: 'session',
  key: 'key'
});

export const auth = lucia({
  adapter,
  env: dev ? 'DEV' : 'PROD',
  middleware: sveltekit(),
  sessionCookie: {
    attributes: {
      secure: !dev,
      sameSite: 'lax'
    }
  },
  getUserAttributes: (databaseUser) => ({
    email: databaseUser.email,
    emailVerified: Boolean(databaseUser.email_verified)
  })
});

export type AuthRequest = ReturnType<typeof auth.handleRequest>;
export type LuciaUser = User;
export type LuciaSession = Session;

declare module 'lucia' {
  interface Register {
    Lucia: typeof auth;
    DatabaseUserAttributes: {
      email: string;
      email_verified: number;
    };
  }
}
