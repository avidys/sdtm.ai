import type { AuthRequest, LuciaSession, LuciaUser } from '$lib/server/lucia';

declare global {
  namespace App {
    interface Locals {
      auth: AuthRequest;
      user: LuciaUser | null;
      session: LuciaSession | null;
    }
    interface PageData {
      user: LuciaUser | null;
    }
  }
}

export {};
