# Supabase Setup Instructions

## Create Profiles Table

1. **Go to your Supabase Dashboard**
   - Navigate to: https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Copy and paste the contents of `supabase_migration.sql`
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Verify the Table**
   - Go to "Table Editor" in the left sidebar
   - You should see a `profiles` table with columns:
     - `id` (uuid, primary key)
     - `email` (text)
     - `full_name` (text, nullable)
     - `organization` (text, nullable)
     - `created_at` (timestamp)

## Schema Exposure (if you get PGRST106 error)

If you still see the `PGRST106` error after creating the table, you need to expose the `public` schema:

1. **Go to Project Settings**
   - Click the gear icon ⚙️ in the left sidebar
   - Select "API"

2. **Update Exposed Schemas**
   - Scroll down to "Exposed schemas"
   - Add `public` to the list (usually shows `api`)
   - Format: `public,api` or just `public` if you want everything public

3. **Save Changes**

## Authentication Fix

The code has been updated to use `getUser()` instead of `getSession()` for better security. This:
- Authenticates the user with Supabase server
- Prevents cookie tampering attacks
- Follows Supabase best practices

The authenticated user is now available as `locals.user` instead of `locals.session.user`.

## Testing

After running the migration:

1. **Sign up a test user** through your app
2. **Check Supabase Dashboard** → Table Editor → `profiles`
3. **Verify** the profile record appears with the correct user ID and email

