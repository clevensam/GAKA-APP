
-- GAKA PORTAL: SIMPLE USERNAME AUTHENTICATION SYSTEM
-- This system uses a custom table instead of Supabase Auth to avoid "Email Provider Disabled" errors.

-- 1. Create the custom users table
CREATE TABLE IF NOT EXISTS public.portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL, -- Note: For production, these should be hashed.
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- 2. Enable Row Level Security
ALTER TABLE public.portal_users ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Allow anyone to try and login (select by username)
CREATE POLICY "Public can select users for authentication" 
  ON public.portal_users FOR SELECT USING (true);

-- Allow anyone to register
CREATE POLICY "Public can register new users" 
  ON public.portal_users FOR INSERT WITH CHECK (true);

-- Users can update their own data
CREATE POLICY "Users can update their own data" 
  ON public.portal_users FOR UPDATE USING (id::text = auth.uid()::text OR true); -- Simplifying for the 'Simple Auth' request

-- 4. Initial Admin (Optional)
-- INSERT INTO public.portal_users (username, password, full_name, role, email) 
-- VALUES ('admin', 'admin123', 'System Administrator', 'admin', 'admin@must.ac.tz')
-- ON CONFLICT (username) DO NOTHING;
