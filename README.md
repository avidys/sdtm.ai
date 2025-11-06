# SDTM App

This repository hosts a SvelteKit application scaffolded to support secure authentication flows for SDTM tooling. The app ships with:

- Email magic link authentication backed by Lucia and SQLite
- OAuth integrations for Google, Microsoft Entra ID, and Amazon Login
- Protected application routes with layout guards
- A profile management page for updating basic user metadata

## Getting started

1. Install dependencies
   ```bash
   npm install
   ```

2. Copy the environment template and populate credentials
   ```bash
   cp .env.example .env
   ```

   Provide OAuth client IDs/secrets and set `BASE_URL` to match the deployed origin.

3. Run the development server
   ```bash
   npm run dev -- --open
   ```

The SQLite database is persisted in `data/auth.db`. Delete the file to reset local data.

## Authentication providers

Magic link emails are logged to the server console by default. Wire up an SMTP provider in `src/lib/server/email.ts` to deliver real email.

OAuth callbacks are handled via Lucia's provider integrations. Ensure the redirect URIs configured with each provider match:

- `https://<base>/oauth/google/callback`
- `https://<base>/oauth/microsoft/callback`
- `https://<base>/oauth/amazon/callback`

Replace `<base>` with the public domain of your deployment.
