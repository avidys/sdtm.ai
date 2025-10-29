<<<<<<< HEAD
# SDTM.ai Compliance Portal

A SvelteKit application for validating clinical study data against CDISC SDTM and SDTMIG standards. The app ingests SAS, CSV, or Parquet files, loads metadata into DuckDB, performs standard-driven quality checks, and exports findings for remediation.

## Features

- Supabase-ready authentication with profile management.
- Dataset ingestion from files or folders, stored in a DuckDB backend.
- Standards catalogue covering SDTM v2.0, SDTMIG v3.4, Define-XML 2.0, and the March 2025 controlled terminology release.
- Compliance engine that validates required variables, data types, controlled terminology, and key domain metadata.
- Findings dashboard with per-run summaries, Excel exports, and Define-XML generation for downstream review.
- Deployment-friendly configuration supporting Vercel or Cloudflare adapters through `SDTM_AI_ADAPTER`.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env
   # set SUPABASE_URL, SUPABASE_ANON_KEY, and optional SDTM_AI_DUCKDB_PATH
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Environment variables

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL for authentication |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SDTM_AI_DUCKDB_PATH` | Optional path for the DuckDB database file (defaults to `./data/app.duckdb`) |
| `SDTM_AI_ADAPTER` | Set to `auto`, `vercel`, or `cloudflare` to choose the adapter |

## Testing and linting

- `npm run lint` – ESLint with Svelte and TypeScript support
- `npm run check` – Svelte type checks
- `npm run test` – Vitest test runner (add tests under `src`)

## Deployment

Set `SDTM_AI_ADAPTER=vercel` or `SDTM_AI_ADAPTER=cloudflare` during the build step to generate platform-specific output. The default adapter is `@sveltejs/adapter-auto`.

The DuckDB database is stored locally. For production, consider configuring Supabase/Postgres tables to persist dataset metadata.
=======
# sdtm.ai

- backends flask fro dash
- fastapi for DB
- node for SPA sveltekit
>>>>>>> remote-repo-history
