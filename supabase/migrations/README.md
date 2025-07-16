# Database Migrations

## Migration Files

1. **001_create_profiles_table_and_trigger.sql** - User profiles and registration trigger
2. **002_create_complete_database_schema.sql** - Complete application schema
3. **test_complete_schema.sql** - Schema verification tests
4. **SCHEMA_DOCUMENTATION.md** - Complete schema documentation

## How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase in your project (if not already done):
   ```bash
   supabase init
   ```

3. Link to your Supabase project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. Apply all migrations:
   ```bash
   supabase db push
   ```

### Option 2: Manual Application via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Apply migrations in order:
   - Copy and paste contents of `001_create_profiles_table_and_trigger.sql`
   - Execute the SQL
   - Copy and paste contents of `002_create_complete_database_schema.sql`
   - Execute the SQL

## Testing the Migration

### 1. Verify Table Creation

In the Supabase dashboard, go to the Table Editor and verify:
- The `profiles` table exists
- It has columns: `id`, `full_name`, `currency_preference`, `created_at`, `updated_at`
- RLS is enabled

### 2. Test the Trigger

#### Option A: Via Supabase Dashboard
1. Go to Authentication > Users
2. Add a test user manually
3. Check the Table Editor for the `profiles` table to see if a profile was automatically created

#### Option B: Via API
1. Use the Supabase client to register a new user
2. Verify a corresponding profile entry is created

### 3. Test RLS Policies

1. Create two test users
2. Try to access one user's profile data from another user's session
3. Verify that users can only access their own profile data

## Migration Details

### Tables Created
- `public.profiles`: Stores additional user profile information

### Functions Created
- `public.handle_new_user()`: Automatically creates profile entries for new users
- `public.update_updated_at_column()`: Updates the `updated_at` timestamp

### Triggers Created
- `on_auth_user_created`: Executes `handle_new_user()` when new users register
- `update_profiles_updated_at`: Updates the `updated_at` field on profile changes

### RLS Policies Created
- Users can view their own profile
- Users can update their own profile
- Users can insert their own profile

## Rollback

To rollback this migration:

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Drop table
DROP TABLE IF EXISTS public.profiles;
```