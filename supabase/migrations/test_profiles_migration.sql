-- Test script to verify profiles table and trigger functionality
-- Run this in the Supabase SQL Editor after applying the migration

-- 1. Check if profiles table exists and has correct structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check if RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 3. List RLS policies for profiles table
SELECT 
    policyname, 
    cmd, 
    roles 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 4. Check if trigger function exists
SELECT 
    routine_name, 
    routine_type, 
    security_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'handle_new_user';

-- 5. Check if trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_timing 
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
AND trigger_name = 'on_auth_user_created';

-- 6. Test data integrity (should return 0 rows initially)
SELECT COUNT(*) as profile_count FROM public.profiles;

-- Note: To test the trigger, you would need to create a test user
-- either through the Supabase Auth interface or via the auth.users table
-- This should automatically create a corresponding entry in the profiles table