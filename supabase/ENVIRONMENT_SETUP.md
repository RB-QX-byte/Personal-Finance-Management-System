# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# Backend Configuration
PORT=:8080
GIN_MODE=debug
ENVIRONMENT=development

# Database Configuration  
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Supabase Configuration
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_KEY=[YOUR-SERVICE-ROLE-KEY]
SUPABASE_JWT_SECRET=[YOUR-JWT-SECRET]

# JWT Configuration
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4321
```

## How to Get Your Supabase Values

1. **PROJECT_REF**: Found in your Supabase project dashboard URL
2. **ANON_KEY**: Go to Project Settings → API → anon public key
3. **SERVICE_ROLE_KEY**: Go to Project Settings → API → service_role secret key  
4. **JWT_SECRET**: Go to Project Settings → API → JWT Settings → JWT Secret
5. **DATABASE_PASSWORD**: The password you set when creating the project

## Setup Steps

1. Copy the template above to `.env` in your project root
2. Replace all `[YOUR-*]` placeholders with actual values from your Supabase dashboard
3. Save the file
4. Restart your backend server to load the new environment variables

## Frontend Environment

For the frontend, create a `.env` file in the `frontend/` directory:

```bash
PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
``` 