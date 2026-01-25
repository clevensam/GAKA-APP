
-- GAKA PORTAL: STRICT USERNAME AUTHENTICATION SETUP
-- This script configures the database to handle username-only logins

-- 1. Create the public profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are readable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can only update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Create a function to validate the email format (Must be username@gaka.local)
-- This acts as a server-side check to "disable" standard email signups
CREATE OR REPLACE FUNCTION public.validate_shadow_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email NOT LIKE '%@gaka.local' THEN
    RAISE EXCEPTION 'Invalid registration attempt. Standard emails are disabled. Use GAKA username format.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create a function to handle the profile creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user_sync()
RETURNS TRIGGER AS $$
DECLARE
  username_val TEXT;
BEGIN
  -- Extract username from metadata or the email prefix
  username_val := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (
    NEW.id,
    username_val,
    NEW.raw_user_meta_data->>'full_name',
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Set up the triggers on the auth.users table
-- Trigger to enforce shadow email format
DROP TRIGGER IF EXISTS on_auth_user_created_validation ON auth.users;
CREATE TRIGGER on_auth_user_created_validation
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.validate_shadow_email();

-- Trigger to sync profile after successful auth
DROP TRIGGER IF EXISTS on_auth_user_created_sync ON auth.users;
CREATE TRIGGER on_auth_user_created_sync
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_sync();
