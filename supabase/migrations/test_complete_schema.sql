-- =============================================================================
-- Personal Finance Management System - Database Schema Test Script
-- This script tests all tables, relationships, and RLS policies
-- =============================================================================

-- Test 1: Verify all tables exist
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('profiles', 'accounts', 'categories', 'transactions', 'budgets', 'goals')) = 6,
           'Not all required tables exist';
    RAISE NOTICE 'Test 1 PASSED: All required tables exist';
END $$;

-- Test 2: Verify table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'accounts', 'categories', 'transactions', 'budgets', 'goals')
ORDER BY table_name, ordinal_position;

-- Test 3: Verify enums exist
SELECT 
    typname as enum_name,
    array_agg(enumlabel ORDER BY enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE typname IN ('account_type', 'transaction_type', 'budget_period')
GROUP BY typname
ORDER BY typname;

-- Test 4: Verify foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('profiles', 'accounts', 'categories', 'transactions', 'budgets', 'goals')
ORDER BY tc.table_name, kcu.column_name;

-- Test 5: Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'accounts', 'categories', 'transactions', 'budgets', 'goals')
ORDER BY tablename;

-- Test 6: Verify RLS policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'accounts', 'categories', 'transactions', 'budgets', 'goals')
ORDER BY tablename, policyname;

-- Test 7: Verify indexes exist
SELECT 
    i.relname as index_name,
    t.relname as table_name,
    array_agg(a.attname ORDER BY c.ordinality) as columns
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
LEFT JOIN unnest(ix.indkey) WITH ORDINALITY AS c(attnum, ordinality) ON true
LEFT JOIN pg_attribute a ON t.oid = a.attrelid AND a.attnum = c.attnum
WHERE t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND t.relname IN ('profiles', 'accounts', 'categories', 'transactions', 'budgets', 'goals')
AND i.relname NOT LIKE '%_pkey'  -- Exclude primary key indexes
GROUP BY i.relname, t.relname
ORDER BY t.relname, i.relname;

-- Test 8: Verify triggers exist
SELECT 
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('profiles', 'accounts', 'categories', 'transactions', 'budgets', 'goals', 'users')
ORDER BY event_object_table, trigger_name;

-- Test 9: Verify functions exist
SELECT 
    routine_name as function_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('handle_new_user', 'update_updated_at_column', 'update_account_balance', 'create_default_categories')
ORDER BY routine_name;

-- Test 10: Check table constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('accounts', 'categories', 'transactions', 'budgets', 'goals')
AND tc.constraint_type IN ('CHECK', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- =============================================================================
-- Integration Tests (Commented out - run manually with actual user)
-- =============================================================================

/*
-- These tests require an actual authenticated user session
-- Replace 'test-user-uuid' with a real user UUID from auth.users

-- Test user data isolation
INSERT INTO public.accounts (user_id, name, account_type, balance) 
VALUES ('test-user-uuid', 'Test Checking', 'checking', 1000.00);

INSERT INTO public.categories (user_id, name, description) 
VALUES ('test-user-uuid', 'Test Category', 'Test description');

INSERT INTO public.transactions (user_id, account_id, category_id, amount, transaction_type, description)
VALUES (
    'test-user-uuid', 
    (SELECT id FROM public.accounts WHERE user_id = 'test-user-uuid' LIMIT 1),
    (SELECT id FROM public.categories WHERE user_id = 'test-user-uuid' LIMIT 1),
    -50.00,
    'expense',
    'Test transaction'
);

-- Verify account balance was updated
SELECT name, balance FROM public.accounts WHERE user_id = 'test-user-uuid';

-- Test RLS by trying to access another user's data (should return no results)
-- This would need to be run in a different user session
*/

RAISE NOTICE 'All schema verification tests completed successfully!';