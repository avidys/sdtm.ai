# Fix PGRST106 Error: Schema Must Be 'api'

## Problem
Your Supabase project is configured to only expose the `api` schema via PostgREST, but your `profiles` table is in the `public` schema.

**Error:**
```
PGRST106: The schema must be one of the following: api
```

## Solution Options

### Option A: Move Table to `api` Schema (Recommended)

1. **Run the SQL Migration:**
   - Go to Supabase Dashboard → SQL Editor
   - Copy and paste the contents of `fix_schema_exposure.sql`
   - Run it

2. **Verify:**
   - Go to Table Editor
   - You should see `api.profiles` (not `public.profiles`)

### Option B: Expose `public` Schema in Supabase Settings

If you want to keep using the `public` schema:

1. **Go to Supabase Dashboard**
   - Click ⚙️ (Settings) → API
   - Scroll to "Exposed schemas"
   - Change from `api` to `public,api` (or just `public`)
   - Click Save

2. **Note:** This exposes all `public` schema tables, which may be less secure

### Option C: Create View in `api` Schema

If you want to keep the table in `public` but access it via `api`:

```sql
-- Create view in api schema
CREATE SCHEMA IF NOT EXISTS api;

CREATE OR REPLACE VIEW api.profiles AS
SELECT * FROM public.profiles;

-- Grant permissions
GRANT USAGE ON SCHEMA api TO anon, authenticated;
GRANT SELECT ON api.profiles TO anon, authenticated;
```

**Note:** Views have limitations (can't use UPSERT directly), so Option A is recommended.

## Verify Fix

After applying the fix:

1. Refresh your app
2. Try accessing a profile
3. The error should be gone

## Why This Happens

Supabase PostgREST (which powers the Supabase JS client) only exposes schemas you specify in the API settings. By default, many projects only expose `api` for security reasons.

