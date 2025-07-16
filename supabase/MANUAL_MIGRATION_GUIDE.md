# Manual Database Migration Guide

Since the Supabase CLI isn't working, follow these steps to set up your database manually:

## Step 1: Access SQL Editor
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. You'll run each migration file in order

## Step 2: Run Migrations in Order

### Migration 1: Create Profiles Table
1. In the SQL Editor, create a new query
2. Copy and paste the entire contents of `001_create_profiles_table_and_trigger.sql`
3. Click "Run" to execute
4. You should see "Success. No rows returned" message

### Migration 2: Create Complete Database Schema  
1. Create another new query
2. Copy and paste the entire contents of `002_create_complete_database_schema.sql`
3. Click "Run" to execute

### Migration 3: Create Notifications System
1. Create another new query  
2. Copy and paste the entire contents of `003_create_notifications_system.sql`
3. Click "Run" to execute

## Step 3: Verify Setup
After running all migrations, verify your setup:

1. Go to "Database" → "Tables" in your Supabase dashboard
2. You should see these tables:
   - profiles
   - accounts
   - categories
   - transactions
   - budgets
   - goals
   - notifications
   - user_preferences

## Step 4: Test Connection
1. Set up your `.env` files as described in `ENVIRONMENT_SETUP.md`
2. Restart your backend server
3. Visit `http://localhost:8080/health` to test the backend
4. Visit `http://localhost:8080/db-test` to test database connection

## Alternative: Quick Setup Script
If you prefer, you can also:
1. Copy all SQL from the three migration files
2. Paste them into a single SQL Editor query (in order)
3. Run all at once

## Troubleshooting
- If you get permission errors, make sure you're using the service role key in your backend
- If tables already exist, you may need to drop them first or skip those parts
- Check the Supabase logs if migrations fail 