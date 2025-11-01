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

0. preresuisite
   - node
   - pnpm
   - python >= 3.12
   - uv
  
1. Run the backend development server:

   ```bash
   cd backend
   uv pip install / uv sync --> create .venv
   uv run main.py
   # or
   uv run uvicorn app.api:app
   ```

2. Run the frontend development server:

   ```bash
   cd frontend
   cp .env.example .env
   # set SUPABASE_URL, SUPABASE_ANON_KEY, and optional SDTM_AI_DUCKDB_PATH
   pnpm i
   pnpm build
   pnpm dev
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

Render.com doesnt allow additional packages (ie r-base) without docker

railway
- internal addressing (private network)
- custom package can be added without createin a docker image
- no cold start
- multiservice
- few datacenter
- PG,...
  
render
- no package possible (R)
- langage workflow ( alittle like gg cloud)
- heroku successor
- cron jobs PG
  
vercel
- preconfig for platform -> super easy
- domian immediate integration
- cold start minimal (benchmark to perfrom)
- not easy for multiservice
- best for frontend base incl svkit and next.js
- more datacenter

cloudflare
- node

modal
- python, ai

fly.io
- single app - confgi more difficult



the one that failed should  have the buttong disabled (except remove); 

when login fail, message
login google...
view password
one step setup with email + human check


on dashboard, upload datasets, change "dataset name" to "Dataset"; remove the status at the begining

put some space between the 3 first columns and align parse to success/fail status on the left;
if parsing succeded, rows and cols should be displayed and the buttons enabled