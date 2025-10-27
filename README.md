# SDTM.ai compliance portal

This repository contains a SvelteKit application that ingests clinical study datasets and checks
compliance with CDISC SDTM and SDTMIG guidance. The tool is designed to run on Vercel, Cloudflare (in
Node compatibility mode) or any other SvelteKit-ready hosting provider.

## Features

- Supabase authentication with email magic links and enterprise OAuth providers (Google, Microsoft,
  Amazon)
- Profile management backed by a `profiles` table in Supabase
- Standards library organised the same way as CDISC releases (model, implementation guides,
  terminology, Define-XML)
- Dataset ingestion for CSV, SAS7BDAT and Parquet files with automatic DuckDB staging
- Compliance rules seeded from SDTMIG 4.3 with extensibility for future releases
- Storage of each compliance run (datasets + findings) inside Supabase for auditability
- Export findings to Excel as well as Define-XML and HTML summaries

## Getting started

1. Install dependencies

   ```bash
   npm install
   ```

2. Provide Supabase credentials (create a project at https://supabase.com):

   ```bash
   cp .env.example .env
   ```

   Populate the file with the following values:

   ```env
   PUBLIC_SUPABASE_URL=your-project-url
   PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   PRIVATE_SUPABASE_URL=your-project-url
   PRIVATE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   The service role key is required so that the server can store compliance run summaries. If you do
   not wish to persist results, you can omit it and the application will skip the insert.

3. Prepare Supabase tables

   ```sql
   create table if not exists public.profiles (
     id uuid primary key references auth.users not null,
     email text not null,
     display_name text,
     organization text,
     created_at timestamp with time zone default timezone('utc', now()),
     updated_at timestamp with time zone default timezone('utc', now())
   );

   create table if not exists public.runs (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references auth.users,
     created_at timestamp with time zone default timezone('utc', now()),
     standard_id text not null,
     summary jsonb not null
   );
   ```

4. Start the development server

   ```bash
   npm run dev
   ```

   The app is available at http://localhost:5173.

## Deployment

- **Vercel**: adapter-auto detects the platform. Set the environment variables in the Vercel project
  dashboard and enable the Node.js runtime.
- **Cloudflare Pages/Workers**: enable the Node compatibility flag (DuckDB depends on Node APIs). Add
  the same environment variables via the dashboard.
- **Other platforms**: use `npm run build` to produce a production build.

## Data sources

The repository ships with key CDISC resources used by the rules engine:

- `SDTM_v2.0.pdf` — Study Data Tabulation Model v2.0
- `SDTMIG v3.4-FINAL_2022-07-21.pdf` and `SDTMIG_v3.4.xlsx`
- `SDTM_CT_2025-03-28.xlsx` and `SDTM Terminology.xlsx`

The compliance engine currently implements a focused set of rules from SDTMIG 4.3 and can be extended
by adding new entries in `src/lib/compliance/rules.ts`.

## Roadmap

- Expand the rule catalogue to cover the entirety of SDTMIG 4.3 and subsequent releases
- Integrate with external warehouses (BigQuery, Snowflake) for large volume studies
- Build automated Define-XML renderings with hyperlinks to the CDISC documentation
