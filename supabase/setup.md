# Supabase Setup Guide

## Prerequisites

1. Create a Supabase account at https://app.supabase.com
2. Create a new project in your Supabase dashboard
3. Copy the following values from your project settings:
   - Project URL
   - Anon (public) key
   - Service role (secret) key
   - Database URL (from Database settings)

## Environment Variables

Update your `.env` file with the following values:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project.supabase.co:5432/postgres
```

## Testing the Connection

### Frontend Test
Visit: http://localhost:3000/api/test-connection

### Backend Test  
Visit: http://localhost:8081/db-test

## Database Schema

The database schema will be created in subsequent tasks. This includes:

- Users table (via Supabase Auth)
- Profiles table
- Accounts table
- Transactions table
- Categories table
- Budgets table
- Goals table

## Security

- Row Level Security (RLS) policies will be implemented
- JWT authentication through Supabase Auth
- Environment variables are not committed to version control