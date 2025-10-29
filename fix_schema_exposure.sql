-- Fix PGRST106: Schema must be 'api'
-- This script creates the profiles table in the 'api' schema OR creates a view
-- Run this in Supabase SQL Editor

-- Option 1: Create table directly in 'api' schema (Recommended)
-- First, ensure 'api' schema exists
CREATE SCHEMA IF NOT EXISTS api;

-- Create profiles table in api schema
CREATE TABLE IF NOT EXISTS api.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  organization TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE api.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Users can view own profile" ON api.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON api.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON api.profiles;

-- Create policies for Row Level Security
CREATE POLICY "Users can view own profile"
  ON api.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON api.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON api.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON api.profiles(email);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA api TO anon, authenticated;
GRANT ALL ON api.profiles TO anon, authenticated;

-- Option 2: If you already have public.profiles table, migrate data
-- Uncomment these lines if you need to migrate existing data:
-- INSERT INTO api.profiles (id, email, full_name, organization, created_at)
-- SELECT id, email, full_name, organization, created_at
-- FROM public.profiles
-- ON CONFLICT (id) DO NOTHING;

